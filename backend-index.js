import { createServer } from "http";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
// CORS middleware will be added manually since cors package might not be needed
import { storage } from "./storage.js";
import { whatsappService } from "./whatsapp-service.js";

// Enforce secure session secret in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET must be set in production environment!');
  process.exit(1);
}

const MemStoreSession = MemoryStore(session);

const app = express();

// Trust proxy for secure cookies behind reverse proxy (Pterodactyl/nginx)
app.set('trust proxy', 1);

// Secure CORS configuration for Vercel frontend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Define exact allowed origins for security
  const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:3000', // Local development
  ];
  
  // Add production frontend URLs from environment
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...frontendUrls);
  }
  
  // Allow Vercel preview deployments (flexible pattern for previews)
  if (process.env.VERCEL_PROJECT_NAME && origin) {
    // More flexible pattern for Vercel preview URLs
    if (origin.startsWith(`https://${process.env.VERCEL_PROJECT_NAME}-`) && origin.endsWith('.vercel.app')) {
      allowedOrigins.push(origin);
    }
  }
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Vary', 'Origin'); // Prevent cache poisoning
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: new MemStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Student API routes
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
    const { id } = req.params;
    const student = await storage.getStudentById(id);
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
    const student = await storage.createStudent(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to create student" });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await storage.updateStudent(id, req.body);
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to update student" });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteStudent(id);
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student" });
  }
});

// Session API routes
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
    const session = await storage.getActiveSession();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active session" });
  }
});

app.post("/api/sessions", async (req, res) => {
  try {
    const session = await storage.createSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to create session" });
  }
});

app.post("/api/sessions/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.endSession(id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to end session" });
  }
});

// Attendance API routes
app.get("/api/attendance/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const attendance = await storage.getAttendanceBySession(sessionId);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

app.get("/api/attendance/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendance = await storage.getAttendanceByStudent(studentId);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student attendance" });
  }
});

app.post("/api/attendance", async (req, res) => {
  try {
    const attendance = await storage.createAttendance(req.body);
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to record attendance" });
  }
});

// Grades API routes
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
    const grade = await storage.createGrade(req.body);
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: "Failed to create grade" });
  }
});

app.put("/api/grades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const grade = await storage.updateGrade(id, req.body);
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: "Failed to update grade" });
  }
});

app.delete("/api/grades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteGrade(id);
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
    // Disable message export in production for security (prevent accidental PII leaks)
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_EXPORT !== '1') {
      return res.status(403).json({ message: "Message export disabled in production for security" });
    }
    
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
      res.status(500).json({ message: "Failed to send message" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
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

app.post("/api/whatsapp/send-bulk-grades", async (req, res) => {
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
          grade.notes
        );
        
        // Mark as sent
        await storage.updateGrade(gradeId, { sentToParent: true });
        sent++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to send grade message for ${student.name}:`, error);
      }
    }
    
    res.json({ sent, total, message: `Successfully sent ${sent} of ${total} messages` });
  } catch (error) {
    res.status(500).json({ message: "Failed to send bulk grade messages" });
  }
});

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 WhatsApp service initialized`);
});

// Initialize WhatsApp service
whatsappService.connect().catch(console.error);

export default app;