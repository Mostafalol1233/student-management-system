// Vercel Serverless Function - Student Management API
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory storage for demo (في production، استخدم database حقيقي)
let students = [
  {
    id: '1',
    name: 'أحمد محمد',
    guardianPhone: '01234567890',
    guardianPhone2: '01098765432',
    address: 'القاهرة، مصر',
    code: '123',
    gradeLevel: 'الصف الأول الثانوي',
    section: 'أ',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'فاطمة عبدالله',
    guardianPhone: '01555666777',
    guardianPhone2: null,
    address: 'الجيزة، مصر',
    code: '456',
    gradeLevel: 'الصف الثاني الثانوي',
    section: 'ب',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

let sessions = [
  {
    id: '1',
    name: 'جلسة الرياضيات - الدرس الأول',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 90,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

let attendance = [];
let grades = [];

// Helper function to generate unique student code
function generateStudentCode() {
  let code;
  do {
    code = Math.floor(100 + Math.random() * 900).toString();
  } while (students.some(student => student.code === code));
  return code;
}

// API Health Check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Student Management API is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Student Routes
app.get('/api/students', (req, res) => {
  res.json(students);
});

app.get('/api/students/:id', (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  res.json(student);
});

app.get('/api/students/code/:code', (req, res) => {
  const student = students.find(s => s.code === req.params.code);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  res.json(student);
});

app.post('/api/students', (req, res) => {
  try {
    const studentData = {
      id: Date.now().toString(),
      name: req.body.name,
      guardianPhone: req.body.guardianPhone,
      guardianPhone2: req.body.guardianPhone2 || null,
      address: req.body.address || '',
      code: generateStudentCode(),
      gradeLevel: req.body.gradeLevel,
      section: req.body.section,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    students.push(studentData);
    res.status(201).json(studentData);
  } catch (error) {
    res.status(400).json({ message: 'Invalid student data', error: error.message });
  }
});

// Session Routes
app.get('/api/sessions', (req, res) => {
  res.json(sessions);
});

app.get('/api/sessions/active', (req, res) => {
  const activeSession = sessions.find(s => s.status === 'active');
  if (!activeSession) {
    return res.status(404).json({ message: 'No active session found' });
  }
  res.json(activeSession);
});

app.post('/api/sessions', (req, res) => {
  try {
    const sessionData = {
      id: Date.now().toString(),
      name: req.body.name,
      date: req.body.date,
      time: req.body.time,
      duration: req.body.duration,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    sessions.push(sessionData);
    res.status(201).json(sessionData);
  } catch (error) {
    res.status(400).json({ message: 'Invalid session data', error: error.message });
  }
});

app.put('/api/sessions/:id', (req, res) => {
  const sessionIndex = sessions.findIndex(s => s.id === req.params.id);
  if (sessionIndex === -1) {
    return res.status(404).json({ message: 'Session not found' });
  }
  
  sessions[sessionIndex] = { ...sessions[sessionIndex], ...req.body };
  res.json(sessions[sessionIndex]);
});

// Attendance Routes
app.get('/api/attendance', (req, res) => {
  const { sessionId, studentId } = req.query;
  
  let result = attendance;
  if (sessionId) {
    result = result.filter(a => a.sessionId === sessionId);
  }
  if (studentId) {
    result = result.filter(a => a.studentId === studentId);
  }
  
  res.json(result);
});

app.post('/api/attendance', (req, res) => {
  try {
    // Check if attendance already exists
    const existingAttendance = attendance.find(
      a => a.studentId === req.body.studentId && a.sessionId === req.body.sessionId
    );
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already recorded for this student in this session' });
    }
    
    const attendanceData = {
      id: Date.now().toString(),
      studentId: req.body.studentId,
      sessionId: req.body.sessionId,
      status: req.body.status,
      scanMethod: req.body.scanMethod || 'manual',
      timeRecorded: new Date().toISOString()
    };
    
    attendance.push(attendanceData);
    res.status(201).json(attendanceData);
  } catch (error) {
    res.status(400).json({ message: 'Invalid attendance data', error: error.message });
  }
});

// Grades Routes
app.get('/api/grades', (req, res) => {
  const { studentId } = req.query;
  
  let result = grades;
  if (studentId) {
    result = result.filter(g => g.studentId === studentId);
  }
  
  res.json(result);
});

app.post('/api/grades', (req, res) => {
  try {
    const score = parseInt(req.body.score);
    const totalMarks = parseInt(req.body.totalMarks);
    const percentage = (score / totalMarks) * 100;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    const gradeData = {
      id: Date.now().toString(),
      studentId: req.body.studentId,
      subject: req.body.subject,
      assessmentType: req.body.assessmentType,
      score: score,
      totalMarks: totalMarks,
      grade: grade,
      notes: req.body.notes || '',
      sentToParent: false,
      createdAt: new Date().toISOString()
    };
    
    grades.push(gradeData);
    res.status(201).json(gradeData);
  } catch (error) {
    res.status(400).json({ message: 'Invalid grade data', error: error.message });
  }
});

// WhatsApp Routes
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ 
    status: 'disconnected', 
    message: 'WhatsApp service is not connected in demo mode',
    qrCode: null
  });
});

app.post('/api/whatsapp/connect', (req, res) => {
  res.json({ message: 'WhatsApp connection initiated (demo mode)' });
});

app.post('/api/whatsapp/send', (req, res) => {
  res.json({ 
    message: 'Message sent successfully (demo mode)',
    to: req.body.to,
    messageType: req.body.messageType || 'text'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export for Vercel
module.exports = app;