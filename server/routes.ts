import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSessionSchema, insertAttendanceSchema, insertGradeSchema } from "@shared/schema";
import { z } from "zod";

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

  app.put("/api/students/:id", async (req, res) => {
    try {
      const updates = req.body;
      const student = await storage.updateStudent(req.params.id, updates);
      res.json(student);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
