import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSessionSchema, insertAttendanceSchema, insertGradeSchema, insertGroupSchema, insertHomeworkSchema, insertHomeworkSubmissionSchema, insertFinanceSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import path from "path";
import fs from "fs";
import { whatsappService } from "./whatsapp-service";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.get("/api/students/code/:code", async (req, res) => {
    try {
      const student = await storage.getStudentByCode(req.params.code);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.post("/api/students/bulk-import", upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must have header and at least one data row" });
      }

      const header = lines[0].split(',').map(h => h.trim());
      const results = {
        success: [] as any[],
        errors: [] as { row: number; error: string; data: string }[]
      };

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        try {
          // Map CSV columns to student data
          const studentData: any = {};
          header.forEach((col, index) => {
            const value = values[index] || '';
            switch (col.toLowerCase()) {
              case 'name':
              case 'student name':
              case 'الاسم':
                studentData.name = value;
                break;
              case 'guardian phone':
              case 'guardianphone':
              case 'phone':
              case 'رقم ولي الأمر':
                studentData.guardianPhone = value;
                break;
              case 'guardian phone 2':
              case 'guardianphone2':
              case 'phone2':
              case 'رقم ولي الأمر 2':
                studentData.guardianPhone2 = value || null;
                break;
              case 'address':
              case 'العنوان':
                studentData.address = value || null;
                break;
              case 'grade':
              case 'grade level':
              case 'gradelevel':
              case 'الصف':
                studentData.gradeLevel = value;
                break;
              case 'section':
              case 'class':
              case 'الشعبة':
                studentData.section = value;
                break;
            }
          });

          // Validate required fields
          if (!studentData.name || !studentData.guardianPhone || !studentData.gradeLevel || !studentData.section) {
            results.errors.push({
              row: i + 1,
              error: "Missing required fields (name, guardianPhone, gradeLevel, section)",
              data: lines[i]
            });
            continue;
          }

          const validatedData = insertStudentSchema.parse(studentData);
          const student = await storage.createStudent(validatedData);
          results.success.push(student);
        } catch (error: any) {
          results.errors.push({
            row: i + 1,
            error: error.message || "Failed to process row",
            data: lines[i]
          });
        }
      }

      res.status(200).json({
        message: `Processed ${results.success.length + results.errors.length} rows`,
        successCount: results.success.length,
        errorCount: results.errors.length,
        students: results.success,
        errors: results.errors
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process CSV file", error: error.message });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const updates = req.body;
      const student = await storage.updateStudent(req.params.id, updates);
      res.json(student);
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Session routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      res.json(activeSession || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.id, updates);
      res.json(session);
    } catch (error: any) {
      if (error.message === "Session not found") {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/session/:sessionId", async (req, res) => {
    try {
      const attendance = await storage.getAttendanceBySession(req.params.sessionId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/student/:studentId", async (req, res) => {
    try {
      const attendance = await storage.getAttendanceByStudent(req.params.studentId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      
      // Check if attendance already exists for this student and session
      const existingAttendance = await storage.getAttendanceRecord(
        attendanceData.studentId,
        attendanceData.sessionId
      );
      
      if (existingAttendance) {
        return res.status(409).json({ message: "Attendance already recorded for this student in this session" });
      }

      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  // Grade routes
  app.get("/api/grades", async (req, res) => {
    try {
      const grades = await storage.getAllGrades();
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.get("/api/grades/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const grades = await storage.getGradesByStudent(studentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student grades" });
    }
  });


  app.post("/api/grades", async (req, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid grade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.put("/api/grades/:id", async (req, res) => {
    try {
      const updates = req.body;
      const grade = await storage.updateGrade(req.params.id, updates);
      res.json(grade);
    } catch (error: any) {
      if (error.message === "Grade not found") {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGrade(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  // WhatsApp API routes
  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = whatsappService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get WhatsApp status" });
    }
  });

  app.post("/api/whatsapp/connect", async (req, res) => {
    try {
      await whatsappService.connect();
      res.json({ message: "WhatsApp connection initiated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect to WhatsApp" });
    }
  });

  app.post("/api/whatsapp/disconnect", async (req, res) => {
    try {
      whatsappService.disconnect();
      res.json({ message: "WhatsApp disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
    }
  });

  app.post("/api/whatsapp/send-grade", async (req, res) => {
    try {
      const { studentName, phoneNumber, grade, subject, notes } = req.body;
      
      if (!studentName || !phoneNumber || !grade) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const messageId = await whatsappService.sendGradeMessage(
        studentName, 
        phoneNumber, 
        grade, 
        subject || 'الامتحان',
        notes
      );
      
      res.json({ messageId, message: "Grade message queued successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send grade message" });
    }
  });

  app.get("/api/whatsapp/messages", async (req, res) => {
    try {
      const messages = whatsappService.getStoredMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/whatsapp/messages/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      
      if (format === 'csv') {
        const csvData = whatsappService.downloadMessagesAsCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=whatsapp-messages.csv');
        res.send(csvData);
      } else {
        const jsonData = whatsappService.downloadMessagesAsJSON();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=whatsapp-messages.json');
        res.send(jsonData);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export messages" });
    }
  });

  app.delete("/api/whatsapp/messages", async (req, res) => {
    try {
      whatsappService.clearMessages();
      res.json({ message: "Messages cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  app.post("/api/whatsapp/send-message/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      const success = await whatsappService.sendStoredMessage(messageId);
      
      if (success) {
        res.json({ message: "Message sent successfully" });
      } else {
        res.status(404).json({ message: "Message not found or already sent" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/whatsapp/send-all", async (req, res) => {
    try {
      const results = await whatsappService.sendAllPendingMessages();
      res.json({ 
        message: "Send all operation completed",
        results
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send all messages" });
    }
  });

  // Group messaging routes
  app.get("/api/whatsapp/groups", async (req, res) => {
    try {
      const groups = await whatsappService.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get groups" });
    }
  });

  app.post("/api/whatsapp/send-group-message", async (req, res) => {
    try {
      const { groupId, message, mentionAll, groupName } = req.body;
      
      if (!groupId || !message) {
        return res.status(400).json({ message: "Group ID and message are required" });
      }

      const messageId = await whatsappService.sendGroupMessage(
        groupId, 
        message, 
        mentionAll || false,
        groupName
      );
      
      res.json({ messageId, message: "Group message queued successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send group message" });
    }
  });

  app.post("/api/whatsapp/mention-all", async (req, res) => {
    try {
      const { groupId, message, groupName } = req.body;
      
      if (!groupId || !message) {
        return res.status(400).json({ message: "Group ID and message are required" });
      }

      const messageId = await whatsappService.mentionAllInGroup(groupId, message, groupName);
      
      res.json({ messageId, message: "Mention all message queued successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send mention all message" });
    }
  });

  const sendBulkGradesHandler = async (req: any, res: any) => {
    try {
      const { gradeIds } = req.body;
      
      if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
        return res.status(400).json({ message: "Grade IDs array is required" });
      }

      const students = await storage.getAllStudents();
      const grades = await storage.getAllGrades();
      
      let sent = 0;
      let total = gradeIds.length;

      for (const gradeId of gradeIds) {
        const grade = grades.find(g => g.id === gradeId);
        if (!grade) continue;

        const student = students.find(s => s.id === grade.studentId);
        if (!student || !student.guardianPhone) continue;

        try {
          await whatsappService.sendGradeMessage(
            student.name,
            student.guardianPhone,
            `${grade.score}/${grade.totalMarks} (${grade.grade})`,
            grade.subject,
            grade.notes || undefined
          );
          await storage.updateGrade(gradeId, { sentToParent: true });
          sent++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to send grade message for ${student.name}:`, error);
        }
      }
      
      res.json({ sent, total, message: `Successfully sent ${sent} of ${total} messages` });
    } catch (error) {
      res.status(500).json({ message: "Failed to send bulk grade messages" });
    }
  };

  app.post("/api/whatsapp/send-grade-notification", sendBulkGradesHandler);
  app.post("/api/whatsapp/send-bulk-grades", sendBulkGradesHandler);

  // ── Groups ──────────────────────────────────────────────────────────────
  app.get("/api/groups", async (_req, res) => {
    try { res.json(await storage.getAllGroups()); } catch { res.status(500).json({ message: "Failed to fetch groups" }); }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const g = await storage.getGroup(req.params.id);
      if (!g) return res.status(404).json({ message: "Group not found" });
      res.json(g);
    } catch { res.status(500).json({ message: "Failed to fetch group" }); }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      res.status(201).json(await storage.createGroup(data));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    try { res.json(await storage.updateGroup(req.params.id, req.body)); }
    catch (e: any) { res.status(e.message?.includes("not found") ? 404 : 500).json({ message: e.message }); }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const ok = await storage.deleteGroup(req.params.id);
      if (!ok) return res.status(404).json({ message: "Group not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete group" }); }
  });

  // ── Homework ─────────────────────────────────────────────────────────────
  app.get("/api/homework", async (_req, res) => {
    try { res.json(await storage.getAllHomework()); } catch { res.status(500).json({ message: "Failed to fetch homework" }); }
  });

  app.post("/api/homework", async (req, res) => {
    try {
      const data = insertHomeworkSchema.parse(req.body);
      res.status(201).json(await storage.createHomework(data));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create homework" });
    }
  });

  app.put("/api/homework/:id", async (req, res) => {
    try { res.json(await storage.updateHomework(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/homework/:id", async (req, res) => {
    try {
      const ok = await storage.deleteHomework(req.params.id);
      if (!ok) return res.status(404).json({ message: "Homework not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete homework" }); }
  });

  app.get("/api/homework/submissions", async (_req, res) => {
    try {
      const allHw = await storage.getAllHomework();
      const allSubs: any[] = [];
      for (const hw of allHw) {
        const subs = await storage.getSubmissionsByHomework(hw.id);
        allSubs.push(...subs);
      }
      res.json(allSubs);
    } catch { res.status(500).json({ message: "Failed to fetch submissions" }); }
  });

  app.post("/api/homework/submissions", async (req, res) => {
    try {
      const data = insertHomeworkSubmissionSchema.parse(req.body);
      res.status(201).json(await storage.createSubmission(data));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.put("/api/homework/submissions/:id", async (req, res) => {
    try { res.json(await storage.updateSubmission(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Finances ─────────────────────────────────────────────────────────────
  app.get("/api/finances", async (_req, res) => {
    try { res.json(await storage.getAllFinances()); } catch { res.status(500).json({ message: "Failed to fetch finances" }); }
  });

  app.get("/api/finances/student/:studentId", async (req, res) => {
    try { res.json(await storage.getFinancesByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch finances" }); }
  });

  app.post("/api/finances", async (req, res) => {
    try {
      const data = insertFinanceSchema.parse(req.body);
      res.status(201).json(await storage.createFinance(data));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });

  app.put("/api/finances/:id", async (req, res) => {
    try { res.json(await storage.updateFinance(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/finances/:id", async (req, res) => {
    try {
      const ok = await storage.deleteFinance(req.params.id);
      if (!ok) return res.status(404).json({ message: "Finance record not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete finance record" }); }
  });

  // ── Homework: submissions by student ─────────────────────────────────────
  app.get("/api/homework/submissions/student/:studentId", async (req, res) => {
    try { res.json(await storage.getSubmissionsByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch student submissions" }); }
  });

  app.get("/api/homework/:homeworkId/submissions", async (req, res) => {
    try { res.json(await storage.getSubmissionsByHomework(req.params.homeworkId)); }
    catch { res.status(500).json({ message: "Failed to fetch submissions" }); }
  });

  // ── Grades by student ─────────────────────────────────────────────────────
  app.get("/api/grades/student/:studentId", async (req, res) => {
    try { res.json(await storage.getGradesByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch grades" }); }
  });

  // ── Student Notes ─────────────────────────────────────────────────────────
  app.get("/api/student-notes/:studentId", async (req, res) => {
    try { res.json(await storage.getNotesByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch notes" }); }
  });

  app.post("/api/student-notes", async (req, res) => {
    try {
      const { studentId, content, type } = req.body;
      if (!studentId || !content) return res.status(400).json({ message: "studentId and content required" });
      res.status(201).json(await storage.createNote({ studentId, content, type: type || "general" }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/student-notes/:id", async (req, res) => {
    try {
      const ok = await storage.deleteNote(req.params.id);
      if (!ok) return res.status(404).json({ message: "Note not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete note" }); }
  });

  // ── Exams ─────────────────────────────────────────────────────────────────
  app.get("/api/exams", async (_req, res) => {
    try { res.json(await storage.getAllExams()); }
    catch { res.status(500).json({ message: "Failed to fetch exams" }); }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      res.json(exam);
    } catch { res.status(500).json({ message: "Failed to fetch exam" }); }
  });

  app.post("/api/exams", async (req, res) => {
    try {
      const { title, subject, groupId, date, duration, description } = req.body;
      if (!title || !subject || !date) return res.status(400).json({ message: "title, subject, date required" });
      res.status(201).json(await storage.createExam({ title, subject, groupId: groupId === "all" ? null : (groupId || null), date, duration: duration || 60, description: description || null }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/exams/:id", async (req, res) => {
    try { res.json(await storage.updateExam(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/exams/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExam(req.params.id);
      if (!ok) return res.status(404).json({ message: "Exam not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete exam" }); }
  });

  // ── Exam Questions ────────────────────────────────────────────────────────
  app.get("/api/exams/:examId/questions", async (req, res) => {
    try { res.json(await storage.getExamQuestions(req.params.examId)); }
    catch { res.status(500).json({ message: "Failed to fetch questions" }); }
  });

  app.post("/api/exams/:examId/questions", async (req, res) => {
    try {
      const { question, type, options, correctAnswer, marks, orderIndex } = req.body;
      if (!question) return res.status(400).json({ message: "question required" });
      res.status(201).json(await storage.createExamQuestion({ examId: req.params.examId, question, type: type || "short", options: options || null, correctAnswer: correctAnswer || null, marks: marks || 5, orderIndex: orderIndex || 0 }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/exam-questions/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExamQuestion(req.params.id);
      if (!ok) return res.status(404).json({ message: "Question not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete question" }); }
  });

  // ── Exam Submissions ──────────────────────────────────────────────────────
  app.get("/api/exams/:examId/submissions", async (req, res) => {
    try { res.json(await storage.getExamSubmissions(req.params.examId)); }
    catch { res.status(500).json({ message: "Failed to fetch submissions" }); }
  });

  app.post("/api/exam-submissions", async (req, res) => {
    try {
      const { examId, studentId, score, status } = req.body;
      if (!examId || !studentId) return res.status(400).json({ message: "examId and studentId required" });
      res.status(201).json(await storage.createExamSubmission({ examId, studentId, score: score ?? null, status: status || "pending" }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/exam-submissions/:id", async (req, res) => {
    try { res.json(await storage.updateExamSubmission(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  app.get("/api/settings", async (_req, res) => {
    try { res.json(await storage.getAllSettings()); }
    catch { res.status(500).json({ message: "Failed to fetch settings" }); }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const value = await storage.getSetting(req.params.key);
      if (value === undefined) return res.status(404).json({ message: "Setting not found" });
      res.json({ key: req.params.key, value });
    } catch { res.status(500).json({ message: "Failed to fetch setting" }); }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) return res.status(400).json({ message: "value required" });
      await storage.setSetting(req.params.key, String(value));
      res.json({ key: req.params.key, value: String(value) });
    } catch { res.status(500).json({ message: "Failed to update setting" }); }
  });

  // ── Backend ZIP Download ──────────────────────────────────────────────────
  app.get("/api/download/backend", (_req, res) => {
    try {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=student-system-backend.zip");
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (err: Error) => { res.status(500).send({ error: err.message }); });
      archive.pipe(res);
      const rootDir = path.resolve(process.cwd());
      // Include server files
      archive.directory(path.join(rootDir, "server"), "server");
      archive.directory(path.join(rootDir, "shared"), "shared");
      // Include config files
      for (const f of ["package.json", "tsconfig.json", "drizzle.config.ts"]) {
        const fp = path.join(rootDir, f);
        if (fs.existsSync(fp)) archive.file(fp, { name: f });
      }
      // README
      archive.append(
        `# Student System - Backend\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Environment Variables\n\n- \`DATABASE_URL\` — PostgreSQL connection string\n- \`PORT\` — Server port (default: 5000)\n\n## Deploy to Railway / Render\n\n1. Push this folder to GitHub\n2. Connect to Railway or Render\n3. Set DATABASE_URL env var\n4. Deploy!\n`,
        { name: "README.md" }
      );
      archive.finalize();
    } catch (err: any) {
      res.status(500).json({ message: "Failed to create ZIP", error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
