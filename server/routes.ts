import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSessionSchema, insertAttendanceSchema, insertGradeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
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
      const grades = await storage.getGradesByStudent(req.params.studentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grades" });
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
      const { studentName, phoneNumber, grade, subject } = req.body;
      
      if (!studentName || !phoneNumber || !grade) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const messageId = await whatsappService.sendGradeMessage(
        studentName, 
        phoneNumber, 
        grade, 
        subject || 'الامتحان'
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

  const httpServer = createServer(app);
  return httpServer;
}
