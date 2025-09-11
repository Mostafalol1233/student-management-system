import { type Student, type InsertStudent, type Session, type InsertSession, type Attendance, type InsertAttendance, type Grade, type InsertGrade } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByCode(code: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<boolean>;

  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getActiveSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;

  // Attendance operations
  getAttendanceBySession(sessionId: string): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceRecord(studentId: string, sessionId: string): Promise<Attendance | undefined>;

  // Grade operations
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getAllGrades(): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, updates: Partial<Grade>): Promise<Grade>;
  deleteGrade(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private sessions: Map<string, Session>;
  private attendance: Map<string, Attendance>;
  private grades: Map<string, Grade>;

  constructor() {
    this.students = new Map();
    this.sessions = new Map();
    this.attendance = new Map();
    this.grades = new Map();
  }

  // Generate unique 3-digit code
  private generateStudentCode(): string {
    let code: string;
    do {
      code = Math.floor(100 + Math.random() * 900).toString();
    } while (Array.from(this.students.values()).some(student => student.code === code));
    return code;
  }

  // Calculate letter grade
  private calculateLetterGrade(score: number, totalMarks: number): string {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }

  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByCode(code: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.code === code);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const code = this.generateStudentCode();
    const student: Student = {
      ...insertStudent,
      id,
      code,
      qrPath: null,
      status: "active",
      createdAt: new Date(),
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const student = this.students.get(id);
    if (!student) throw new Error("Student not found");
    
    const updatedStudent = { ...student, ...updates };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getActiveSession(): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.status === "active");
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      id,
      status: "scheduled",
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Attendance operations
  async getAttendanceBySession(sessionId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.sessionId === sessionId);
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.studentId === studentId);
  }

  async getAttendanceRecord(studentId: string, sessionId: string): Promise<Attendance | undefined> {
    return Array.from(this.attendance.values()).find(att => 
      att.studentId === studentId && att.sessionId === sessionId
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = {
      ...insertAttendance,
      id,
      timeRecorded: new Date(),
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  // Grade operations
  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.studentId === studentId);
  }

  async getAllGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const grade: Grade = {
      ...insertGrade,
      id,
      grade: this.calculateLetterGrade(insertGrade.score, insertGrade.totalMarks),
      createdAt: new Date(),
    };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: string, updates: Partial<Grade>): Promise<Grade> {
    const grade = this.grades.get(id);
    if (!grade) throw new Error("Grade not found");
    
    const updatedGrade = { 
      ...grade, 
      ...updates,
      grade: updates.score && updates.totalMarks 
        ? this.calculateLetterGrade(updates.score, updates.totalMarks)
        : grade.grade
    };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: string): Promise<boolean> {
    return this.grades.delete(id);
  }
}

export const storage = new MemStorage();
