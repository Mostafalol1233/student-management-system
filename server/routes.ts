import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSessionSchema, insertAttendanceSchema, insertGradeSchema, insertGroupSchema, insertHomeworkSchema, insertHomeworkSubmissionSchema, insertFinanceSchema, insertTeacherSchema, insertSubjectSchema, insertEnrollmentSchema, insertSubscriptionSchema, loginSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { createRequire as _createRequire } from "module";
const _require = _createRequire(import.meta.url);
const archiver: any = _require("archiver");
import path from "path";
import fs from "fs";
import { whatsappService } from "./whatsapp-service";
import { signToken, hashPassword, comparePassword, requireAuth, requireRole } from "./auth";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV ?? "development",
      version: "1.0.0",
    });
  });

  // ── Dashboard stats ───────────────────────────────────────────────────────
  app.get("/api/stats", async (_req, res) => {
    try {
      const [students, teachers, sessions, grades, finances, attendance] = await Promise.all([
        storage.getAllStudents(),
        storage.getAllTeachers(),
        storage.getAllSessions(),
        storage.getAllGrades(),
        storage.getAllFinances(),
        storage.getAllAttendance(),
      ]);

      const totalStudents = students.length;
      const totalTeachers = teachers.length;
      const completedSessions = sessions.filter(s => s.status === "completed").length;
      const activeSessions = sessions.filter(s => s.status === "active").length;

      const totalRevenue = finances
        .filter(f => f.status === "paid")
        .reduce((sum, f) => sum + (f.paid ?? 0), 0);
      const pendingRevenue = finances
        .filter(f => f.status === "pending")
        .reduce((sum, f) => sum + ((f.amount ?? 0) - (f.paid ?? 0)), 0);

      const ungradedCount = grades.filter(g => g.score === null || g.score === undefined).length;

      const attendanceRates = students.map(s => {
        const studentAttendance = attendance.filter(a => a.studentId === s.id);
        const present = studentAttendance.filter(a => a.status === "present").length;
        return studentAttendance.length > 0 ? (present / studentAttendance.length) * 100 : 100;
      });
      const avgAttendanceRate = attendanceRates.length > 0
        ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
        : 0;

      const atRiskStudents = students.filter(s => {
        const sa = attendance.filter(a => a.studentId === s.id);
        if (sa.length < 3) return false;
        const rate = sa.filter(a => a.status === "present").length / sa.length;
        return rate < 0.75;
      }).length;

      res.json({
        totalStudents,
        totalTeachers,
        completedSessions,
        activeSessions,
        totalRevenue,
        pendingRevenue,
        ungradedCount,
        avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
        atRiskStudents,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ── Auth routes ───────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || user.status !== "active") {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      const valid = await comparePassword(password, user.password);
      if (!valid) return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      const payload = { userId: user.id, email: user.email, role: user.role as any, name: user.name, teacherId: user.teacherId };
      const token = signToken(payload);
      const { password: _, ...safeUser } = user;
      res.json({ token, user: { ...safeUser, role: user.role } });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.userId);
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/auth/logout", (_req, res) => { res.json({ message: "تم تسجيل الخروج بنجاح" }); });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبتان" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }
      const user = await storage.getUserById(req.user!.userId);
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "كلمة المرور الحالية غير صحيحة" });
      const hashed = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashed });
      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── User management (admin only) ───────────────────────────────────────────
  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    try {
      const all = await storage.getAllUsers();
      res.json(all.map(({ password: _, ...u }) => u));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const hashed = await hashPassword(data.password);
      const user = await storage.createUser({ ...data, password: hashed });
      const { password: _, ...safe } = user;
      res.status(201).json(safe);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const updates = req.body;
      if (updates.password) updates.password = await hashPassword(updates.password);
      const user = await storage.updateUser(req.params.id, updates);
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const ok = await storage.deleteUser(req.params.id);
      if (!ok) return res.status(404).json({ message: "المستخدم غير موجود" });
      res.status(204).send();
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Seed demo data ─────────────────────────────────────────────────────────
  app.post("/api/seed", requireRole("admin"), async (_req, res) => {
    try {
      const userCount = await storage.countUsers();
      if (userCount > 0) return res.json({ message: "البيانات التجريبية موجودة بالفعل", skipped: true });

      // Create demo users
      const adminPass = await hashPassword("admin123");
      const recPass = await hashPassword("rec123");
      const teachPass = await hashPassword("teach123");
      const accPass = await hashPassword("acc123");

      await storage.createUser({ name: "مدير النظام", email: "admin@school.edu", password: adminPass, role: "admin" });
      await storage.createUser({ name: "موظف الاستقبال", email: "reception@school.edu", password: recPass, role: "reception" });
      await storage.createUser({ name: "محاسب النظام", email: "accountant@school.edu", password: accPass, role: "accountant" });

      // Create demo teacher
      const teacher = await storage.createTeacher({
        name: "أستاذ محمد أحمد", subject: "الرياضيات", phone: "01012345678",
        email: "teacher@school.edu", salaryType: "fixed", salaryAmount: 5000,
      });
      await storage.createUser({ name: "أستاذ محمد أحمد", email: "teacher@school.edu", password: teachPass, role: "teacher", teacherId: teacher.id });

      // Create demo subject
      await storage.createSubject({ name: "الرياضيات", teacherId: teacher.id, price: 300, sessionsPerMonth: 8, color: "#6366f1" });
      await storage.createSubject({ name: "الفيزياء", teacherId: teacher.id, price: 300, sessionsPerMonth: 8, color: "#0ea5e9" });

      // Create demo group
      const group = await storage.createGroup({
        name: "مجموعة أولى ثانوي أ", gradeLevel: "أول ثانوي", section: "أ",
        subject: "الرياضيات", teacherId: teacher.id, capacity: 20, color: "#6366f1",
      });

      // Create demo students
      const studentData = [
        { name: "أحمد محمود علي", guardianPhone: "01099887766", gradeLevel: "أول ثانوي", section: "أ" },
        { name: "سارة خالد حسن", guardianPhone: "01088776655", gradeLevel: "أول ثانوي", section: "أ" },
        { name: "عمر يوسف إبراهيم", guardianPhone: "01077665544", gradeLevel: "أول ثانوي", section: "ب" },
        { name: "منى إبراهيم محمد", guardianPhone: "01066554433", gradeLevel: "أول ثانوي", section: "أ" },
        { name: "كريم عبدالله سالم", guardianPhone: "01055443322", gradeLevel: "ثاني ثانوي", section: "أ" },
        { name: "نور الدين عبدالرحمن", guardianPhone: "01044332211", gradeLevel: "ثاني ثانوي", section: "ب" },
        { name: "ياسمين طارق فهمي", guardianPhone: "01033221100", gradeLevel: "أول ثانوي", section: "أ" },
        { name: "محمد علي حسين", guardianPhone: "01122334455", gradeLevel: "أول ثانوي", section: "ب" },
      ];

      const createdStudents: any[] = [];
      for (const s of studentData) {
        const student = await storage.createStudent({ ...s, address: "القاهرة" } as any);
        createdStudents.push(student);
      }

      // Add students to group
      for (const s of createdStudents.slice(0, 6)) {
        await storage.createEnrollment({ studentId: s.id, teacherId: teacher.id, groupId: group.id, status: "active" });
      }

      // Create demo sessions
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const session1 = await storage.createSession({
        name: "حصة الرياضيات - المجموعة أ", date: fmt(today),
        time: "10:00", duration: 90, groupId: group.id, teacherId: teacher.id,
      });
      await storage.updateSession(session1.id, { status: "completed" });

      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const session2 = await storage.createSession({
        name: "حصة مراجعة شاملة", date: fmt(yesterday),
        time: "14:00", duration: 60, groupId: group.id, teacherId: teacher.id,
      });
      await storage.updateSession(session2.id, { status: "completed" });

      // Attendance for session1
      for (const s of createdStudents.slice(0, 5)) {
        await storage.createAttendance({ studentId: s.id, sessionId: session1.id, status: "present", scanMethod: "manual" });
      }
      await storage.createAttendance({ studentId: createdStudents[5].id, sessionId: session1.id, status: "absent", scanMethod: "manual" });

      // Demo grades
      const subjects = ["الرياضيات", "الفيزياء", "الكيمياء"];
      const types = ["امتحان شهري", "واجب منزلي", "مشاركة صفية"];
      for (const s of createdStudents) {
        for (let i = 0; i < 2; i++) {
          const score = 60 + Math.floor(Math.random() * 40);
          await storage.createGrade({
            studentId: s.id,
            subject: subjects[i % subjects.length],
            assessmentType: types[i % types.length],
            score, totalMarks: 100, weight: 1.0,
          });
        }
      }

      // Demo finances
      for (const s of createdStudents) {
        const paid = Math.random() > 0.3 ? 300 : 0;
        await storage.createFinance({
          studentId: s.id, type: "subscription",
          amount: 300, paid, dueDate: fmt(today), status: paid > 0 ? "paid" : "pending",
        });
      }

      res.json({ message: "تم إضافة البيانات التجريبية بنجاح", counts: {
        users: 4, teachers: 1, students: studentData.length, sessions: 2,
        groups: 1, attendance: 6, grades: createdStudents.length * 2,
      }});
    } catch (e: any) {
      console.error("Seed error:", e);
      res.status(500).json({ message: `فشل إضافة البيانات: ${e.message}` });
    }
  });

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

  app.put("/api/settings/:key", requireRole("admin"), async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) return res.status(400).json({ message: "value required" });
      await storage.setSetting(req.params.key, String(value));
      res.json({ key: req.params.key, value: String(value) });
    } catch { res.status(500).json({ message: "Failed to update setting" }); }
  });

  // ── Automation Rules ──────────────────────────────────────────────────────
  app.get("/api/automation-rules", async (_req, res) => {
    try { res.json(await storage.getAllAutomationRules()); }
    catch { res.status(500).json({ message: "Failed to fetch automation rules" }); }
  });

  app.get("/api/automation-rules/:id", async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) return res.status(404).json({ message: "Rule not found" });
      res.json(rule);
    } catch { res.status(500).json({ message: "Failed to fetch rule" }); }
  });

  app.post("/api/automation-rules", async (req, res) => {
    try {
      const { name, description, trigger, triggerConfig, messageTemplate, targetGroup } = req.body;
      if (!name || !trigger || !messageTemplate) return res.status(400).json({ message: "name, trigger, messageTemplate required" });
      res.status(201).json(await storage.createAutomationRule({ name, description: description || null, trigger, triggerConfig: triggerConfig || null, messageTemplate, targetGroup: targetGroup || null }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/automation-rules/:id", async (req, res) => {
    try { res.json(await storage.updateAutomationRule(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/automation-rules/:id", async (req, res) => {
    try {
      const ok = await storage.deleteAutomationRule(req.params.id);
      if (!ok) return res.status(404).json({ message: "Rule not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete rule" }); }
  });

  // ── Automation Rule Runner ────────────────────────────────────────────────
  app.post("/api/automation-rules/:id/run", async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) return res.status(404).json({ message: "Rule not found" });
      if (rule.status !== "active") return res.status(400).json({ message: "Rule is paused" });

      const students = await storage.getAllStudents();
      const appName = (await storage.getSetting("app_name")) || "نظام المدرسة";
      let sent = 0; let skipped = 0; const logs: any[] = [];

      const applyTemplate = (template: string, vars: Record<string, string>) => {
        return template
          .replace(/\{\{اسم_الطالب\}\}/g, vars.studentName || "")
          .replace(/\{\{المادة\}\}/g, vars.subject || "")
          .replace(/\{\{الدرجة\}\}/g, vars.grade || "")
          .replace(/\{\{التاريخ\}\}/g, vars.date || new Date().toLocaleDateString("ar-SA"))
          .replace(/\{\{اسم_المدرسة\}\}/g, appName)
          .replace(/\{\{الحصة\}\}/g, vars.session || "")
          .replace(/\{\{الواجب\}\}/g, vars.homework || "");
      };

      const targetStudents = rule.targetGroup
        ? students.filter(s => s.groupId === rule.targetGroup)
        : students;

      if (rule.trigger === "grade_added" || rule.trigger === "low_grade") {
        const allGrades = await storage.getAllGrades();
        let grades = allGrades.filter(g => !g.sentToParent);
        if (rule.trigger === "low_grade" && rule.triggerConfig) {
          try {
            const cfg = JSON.parse(rule.triggerConfig);
            const threshold = cfg.threshold || 60;
            grades = grades.filter(g => (g.score / g.totalMarks) * 100 < threshold);
          } catch {}
        }
        for (const grade of grades) {
          const student = targetStudents.find(s => s.id === grade.studentId);
          if (!student || !student.guardianPhone) { skipped++; continue; }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, subject: grade.subject, grade: `${grade.score}/${grade.totalMarks} (${grade.grade})`, date: new Date().toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      } else if (rule.trigger === "attendance_absent") {
        const activeSession = await storage.getActiveSession();
        if (activeSession) {
          const sessionAttendance = await storage.getAttendanceBySession(activeSession.id);
          const absentStudents = targetStudents.filter(s => !sessionAttendance.some(a => a.studentId === s.id));
          for (const student of absentStudents) {
            if (!student.guardianPhone) { skipped++; continue; }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, session: activeSession.name, date: new Date().toLocaleDateString("ar-SA") });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        } else { skipped = targetStudents.length; }
      } else if (rule.trigger === "payment_overdue") {
        const allFinances = await storage.getAllFinances();
        const overdueFinances = allFinances.filter(f => f.status === "overdue" || (f.status === "partial" && new Date(f.dueDate) < new Date()));
        for (const finance of overdueFinances) {
          const student = targetStudents.find(s => s.id === finance.studentId);
          if (!student || !student.guardianPhone) { skipped++; continue; }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, date: new Date().toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      } else if (rule.trigger === "homework_due") {
        const allHomework = await storage.getAllHomework();
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const dueHw = allHomework.filter(h => h.deadline === tomorrowStr && h.status === "active");
        for (const hw of dueHw) {
          const hwStudents = hw.groupId ? targetStudents.filter(s => s.groupId === hw.groupId) : targetStudents;
          for (const student of hwStudents) {
            if (!student.guardianPhone) { skipped++; continue; }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, homework: hw.title, date: tomorrowStr });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        }
      } else if (rule.trigger === "session_start") {
        const activeSession = await storage.getActiveSession();
        if (activeSession) {
          for (const student of targetStudents) {
            if (!student.guardianPhone) { skipped++; continue; }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, session: activeSession.name, date: new Date().toLocaleDateString("ar-SA") });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        } else { skipped = targetStudents.length; }
      } else if (rule.trigger === "manual") {
        for (const student of targetStudents) {
          if (!student.guardianPhone) { skipped++; continue; }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, date: new Date().toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      }

      // Update rule stats
      await storage.updateAutomationRule(rule.id, { runCount: (rule.runCount || 0) + 1, lastRun: new Date() });
      res.json({ sent, skipped, total: sent + skipped });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Automation Logs ───────────────────────────────────────────────────────
  app.get("/api/automation-logs", async (_req, res) => {
    try { res.json(await storage.getAllAutomationLogs()); }
    catch { res.status(500).json({ message: "Failed to fetch logs" }); }
  });

  app.get("/api/automation-logs/rule/:ruleId", async (req, res) => {
    try { res.json(await storage.getLogsByRule(req.params.ruleId)); }
    catch { res.status(500).json({ message: "Failed to fetch logs" }); }
  });

  app.delete("/api/automation-logs", async (_req, res) => {
    try { await storage.clearAutomationLogs(); res.status(204).send(); }
    catch { res.status(500).json({ message: "Failed to clear logs" }); }
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

  // ── Teachers ──────────────────────────────────────────────────────────────
  app.get("/api/teachers", async (_req, res) => {
    try { res.json(await storage.getAllTeachers()); }
    catch { res.status(500).json({ message: "Failed to fetch teachers" }); }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const t = await storage.getTeacher(req.params.id);
      if (!t) return res.status(404).json({ message: "Teacher not found" });
      res.json(t);
    } catch { res.status(500).json({ message: "Failed to fetch teacher" }); }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const data = insertTeacherSchema.parse(req.body);
      res.status(201).json(await storage.createTeacher(data));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/teachers/:id", async (req, res) => {
    try { res.json(await storage.updateTeacher(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      const ok = await storage.deleteTeacher(req.params.id);
      if (!ok) return res.status(404).json({ message: "Teacher not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete teacher" }); }
  });

  // ── Subjects ──────────────────────────────────────────────────────────────
  app.get("/api/subjects", async (_req, res) => {
    try { res.json(await storage.getAllSubjects()); }
    catch { res.status(500).json({ message: "Failed to fetch subjects" }); }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      res.status(201).json(await storage.createSubject(data));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    try { res.json(await storage.updateSubject(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    try {
      const ok = await storage.deleteSubject(req.params.id);
      if (!ok) return res.status(404).json({ message: "Subject not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete subject" }); }
  });

  // ── Enrollments ───────────────────────────────────────────────────────────
  app.get("/api/enrollments", async (_req, res) => {
    try { res.json(await storage.getAllEnrollments()); }
    catch { res.status(500).json({ message: "Failed to fetch enrollments" }); }
  });

  app.get("/api/enrollments/student/:studentId", async (req, res) => {
    try { res.json(await storage.getEnrollmentsByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch enrollments" }); }
  });

  app.get("/api/enrollments/teacher/:teacherId", async (req, res) => {
    try { res.json(await storage.getEnrollmentsByTeacher(req.params.teacherId)); }
    catch { res.status(500).json({ message: "Failed to fetch enrollments" }); }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      res.status(201).json(await storage.createEnrollment(data));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/enrollments/:id", async (req, res) => {
    try { res.json(await storage.updateEnrollment(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/enrollments/:id", async (req, res) => {
    try {
      const ok = await storage.deleteEnrollment(req.params.id);
      if (!ok) return res.status(404).json({ message: "Enrollment not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete enrollment" }); }
  });

  // ── Subscriptions ─────────────────────────────────────────────────────────
  app.get("/api/subscriptions", async (_req, res) => {
    try { res.json(await storage.getAllSubscriptions()); }
    catch { res.status(500).json({ message: "Failed to fetch subscriptions" }); }
  });

  app.get("/api/subscriptions/student/:studentId", async (req, res) => {
    try { res.json(await storage.getSubscriptionsByStudent(req.params.studentId)); }
    catch { res.status(500).json({ message: "Failed to fetch subscriptions" }); }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const data = insertSubscriptionSchema.parse(req.body);
      res.status(201).json(await storage.createSubscription(data));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/subscriptions/:id", async (req, res) => {
    try { res.json(await storage.updateSubscription(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const ok = await storage.deleteSubscription(req.params.id);
      if (!ok) return res.status(404).json({ message: "Subscription not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete subscription" }); }
  });

  // ── Expenses ────────────────────────────────────────────────────────────
  app.get("/api/expenses", async (_req, res) => {
    try { res.json(await storage.getAllExpenses()); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const { insertExpenseSchema } = await import("@shared/schema");
      const data = insertExpenseSchema.parse(req.body);
      res.status(201).json(await storage.createExpense(data));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try { res.json(await storage.updateExpense(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExpense(req.params.id);
      if (!ok) return res.status(404).json({ message: "Expense not found" });
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete expense" }); }
  });

  // ── Salary report ────────────────────────────────────────────────────────
  app.get("/api/teachers/:id/salary-report", async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) return res.status(404).json({ message: "Teacher not found" });
      const enrollments = await storage.getAllEnrollments();
      const finances = await storage.getAllFinances();
      const activeStudents = enrollments.filter(e => e.teacherId === teacher.id && e.status === "active");
      const studentCount = activeStudents.length;
      const studentIds = activeStudents.map(e => e.studentId);
      const teacherRevenue = finances
        .filter(f => studentIds.includes(f.studentId) && f.status === "paid")
        .reduce((s, f) => s + (f.paid ?? 0), 0);
      let expectedSalary = 0;
      if (teacher.salaryType === "fixed") expectedSalary = teacher.salaryAmount || 0;
      else if (teacher.salaryType === "per_student") expectedSalary = (teacher.salaryAmount || 0) * studentCount;
      else if (teacher.salaryType === "percentage") expectedSalary = teacherRevenue * ((teacher.salaryAmount || 0) / 100);
      res.json({ teacher, studentCount, teacherRevenue, expectedSalary, paid: 0, remaining: expectedSalary });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Backend export (ZIP download) ──────────────────────────────────────
  app.get("/api/export/backend", async (_req, res) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=\"center-m-backend.zip\"");
      archive.pipe(res);

      const root = process.cwd();

      // Include the pre-built backend/ folder (ready-to-run .js files)
      const backendDir = path.join(root, "backend");
      if (fs.existsSync(backendDir)) {
        for (const file of fs.readdirSync(backendDir)) {
          const filePath = path.join(backendDir, file);
          if (fs.statSync(filePath).isFile()) {
            archive.file(filePath, { name: file });
          }
        }
      }

      await archive.finalize();
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Auto-seed default users + settings on every startup ───────────────────
  (async () => {
    try {
      const userCount = await storage.countUsers();
      if (userCount === 0) {
        const adminPass = await hashPassword("admin123");
        const recPass = await hashPassword("rec123");
        const teachPass = await hashPassword("teach123");
        const accPass = await hashPassword("acc123");

        await storage.createUser({ name: "مدير النظام", email: "admin@school.edu", password: adminPass, role: "admin" });
        await storage.createUser({ name: "موظف الاستقبال", email: "reception@school.edu", password: recPass, role: "reception" });
        await storage.createUser({ name: "محاسب النظام", email: "accountant@school.edu", password: accPass, role: "accountant" });

        const teacher = await storage.createTeacher({
          name: "أستاذ محمد أحمد", subject: "الرياضيات", phone: "01012345678",
          email: "teacher@school.edu", salaryType: "fixed", salaryAmount: 5000,
        });
        await storage.createUser({ name: "أستاذ محمد أحمد", email: "teacher@school.edu", password: teachPass, role: "teacher", teacherId: teacher.id });

        console.log("[seed] Default users created: admin@school.edu / admin123");
      }

      // Seed default settings if not set
      const defaults: Record<string, string> = {
        app_name: "Center M",
        app_tagline: "Center Management",
        semester_start: "2025-09-01",
        semester_end: "2026-06-30",
        grade_a_min: "90",
        grade_b_min: "80",
        grade_c_min: "70",
        grade_d_min: "60",
        currency: "جنيه",
        country_code: "+20",
        primary_color: "#6366f1",
      };
      for (const [key, value] of Object.entries(defaults)) {
        const existing = await storage.getSetting(key);
        if (!existing) await storage.setSetting(key, value);
      }
    } catch (e) {
      console.error("[seed] Auto-seed failed:", e);
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
