import {
  type Student, type InsertStudent,
  type Group, type InsertGroup,
  type Session, type InsertSession,
  type Attendance, type InsertAttendance,
  type Grade, type InsertGrade,
  type Homework, type InsertHomework,
  type HomeworkSubmission, type InsertHomeworkSubmission,
  type Finance, type InsertFinance,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByCode(code: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<boolean>;

  getAllGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;

  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getActiveSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;

  getAttendanceBySession(sessionId: string): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceRecord(studentId: string, sessionId: string): Promise<Attendance | undefined>;

  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getAllGrades(): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, updates: Partial<Grade>): Promise<Grade>;
  deleteGrade(id: string): Promise<boolean>;

  getAllHomework(): Promise<Homework[]>;
  getHomework(id: string): Promise<Homework | undefined>;
  createHomework(hw: InsertHomework): Promise<Homework>;
  updateHomework(id: string, updates: Partial<Homework>): Promise<Homework>;
  deleteHomework(id: string): Promise<boolean>;
  getSubmissionsByHomework(homeworkId: string): Promise<HomeworkSubmission[]>;
  getSubmissionsByStudent(studentId: string): Promise<HomeworkSubmission[]>;
  createSubmission(sub: InsertHomeworkSubmission): Promise<HomeworkSubmission>;
  updateSubmission(id: string, updates: Partial<HomeworkSubmission>): Promise<HomeworkSubmission>;

  getAllFinances(): Promise<Finance[]>;
  getFinancesByStudent(studentId: string): Promise<Finance[]>;
  createFinance(finance: InsertFinance): Promise<Finance>;
  updateFinance(id: string, updates: Partial<Finance>): Promise<Finance>;
  deleteFinance(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students = new Map<string, Student>();
  private groups = new Map<string, Group>();
  private sessions = new Map<string, Session>();
  private attendance = new Map<string, Attendance>();
  private grades = new Map<string, Grade>();
  private homework = new Map<string, Homework>();
  private submissions = new Map<string, HomeworkSubmission>();
  private finances = new Map<string, Finance>();

  private generateStudentCode(): string {
    let code: string;
    do { code = Math.floor(100 + Math.random() * 900).toString(); }
    while (Array.from(this.students.values()).some(s => s.code === code));
    return code;
  }

  private calcGrade(score: number, total: number): string {
    const p = (score / total) * 100;
    if (p >= 90) return "A"; if (p >= 80) return "B"; if (p >= 70) return "C"; if (p >= 60) return "D"; return "F";
  }

  async getStudent(id: string) { return this.students.get(id); }
  async getStudentByCode(code: string) { return Array.from(this.students.values()).find(s => s.code === code); }
  async getAllStudents() { return Array.from(this.students.values()); }
  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const s: Student = { ...input, id, code: this.generateStudentCode(), guardianPhone2: input.guardianPhone2 || null, address: input.address || null, groupId: input.groupId || null, qrPath: null, status: "active", createdAt: new Date() };
    this.students.set(id, s); return s;
  }
  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const s = this.students.get(id); if (!s) throw new Error("Student not found");
    const updated = { ...s, ...updates }; this.students.set(id, updated); return updated;
  }
  async deleteStudent(id: string) { return this.students.delete(id); }

  async getAllGroups() { return Array.from(this.groups.values()); }
  async getGroup(id: string) { return this.groups.get(id); }
  async createGroup(input: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const g: Group = { ...input, id, subject: input.subject || null, description: input.description || null, color: input.color || "#3b82f6", createdAt: new Date() };
    this.groups.set(id, g); return g;
  }
  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const g = this.groups.get(id); if (!g) throw new Error("Group not found");
    const updated = { ...g, ...updates }; this.groups.set(id, updated); return updated;
  }
  async deleteGroup(id: string) { return this.groups.delete(id); }

  async getSession(id: string) { return this.sessions.get(id); }
  async getAllSessions() { return Array.from(this.sessions.values()); }
  async getActiveSession() { return Array.from(this.sessions.values()).find(s => s.status === "active"); }
  async createSession(input: InsertSession): Promise<Session> {
    const id = randomUUID();
    const s: Session = { ...input, id, groupId: input.groupId || null, status: "scheduled", createdAt: new Date() };
    this.sessions.set(id, s); return s;
  }
  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const s = this.sessions.get(id); if (!s) throw new Error("Session not found");
    const updated = { ...s, ...updates }; this.sessions.set(id, updated); return updated;
  }

  async getAttendanceBySession(sessionId: string) { return Array.from(this.attendance.values()).filter(a => a.sessionId === sessionId); }
  async getAttendanceByStudent(studentId: string) { return Array.from(this.attendance.values()).filter(a => a.studentId === studentId); }
  async getAttendanceRecord(studentId: string, sessionId: string) { return Array.from(this.attendance.values()).find(a => a.studentId === studentId && a.sessionId === sessionId); }
  async createAttendance(input: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const a: Attendance = { ...input, id, timeRecorded: new Date() };
    this.attendance.set(id, a); return a;
  }

  async getGradesByStudent(studentId: string) { return Array.from(this.grades.values()).filter(g => g.studentId === studentId); }
  async getAllGrades() { return Array.from(this.grades.values()); }
  async createGrade(input: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const g: Grade = { ...input, id, notes: input.notes || null, weight: input.weight ?? 1.0, grade: this.calcGrade(input.score, input.totalMarks), sentToParent: false, createdAt: new Date() };
    this.grades.set(id, g); return g;
  }
  async updateGrade(id: string, updates: Partial<Grade>): Promise<Grade> {
    const g = this.grades.get(id); if (!g) throw new Error("Grade not found");
    const updated = { ...g, ...updates };
    if (updates.score !== undefined || updates.totalMarks !== undefined) updated.grade = this.calcGrade(updated.score, updated.totalMarks);
    this.grades.set(id, updated); return updated;
  }
  async deleteGrade(id: string) { return this.grades.delete(id); }

  async getAllHomework() { return Array.from(this.homework.values()); }
  async getHomework(id: string) { return this.homework.get(id); }
  async createHomework(input: InsertHomework): Promise<Homework> {
    const id = randomUUID();
    const h: Homework = { ...input, id, description: input.description || null, groupId: input.groupId || null, totalMarks: input.totalMarks ?? 10, status: "active", createdAt: new Date() };
    this.homework.set(id, h); return h;
  }
  async updateHomework(id: string, updates: Partial<Homework>): Promise<Homework> {
    const h = this.homework.get(id); if (!h) throw new Error("Homework not found");
    const updated = { ...h, ...updates }; this.homework.set(id, updated); return updated;
  }
  async deleteHomework(id: string) { return this.homework.delete(id); }
  async getSubmissionsByHomework(homeworkId: string) { return Array.from(this.submissions.values()).filter(s => s.homeworkId === homeworkId); }
  async getSubmissionsByStudent(studentId: string) { return Array.from(this.submissions.values()).filter(s => s.studentId === studentId); }
  async createSubmission(input: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const id = randomUUID();
    const s: HomeworkSubmission = { ...input, id, score: input.score ?? null, notes: input.notes || null, submittedAt: new Date() };
    this.submissions.set(id, s); return s;
  }
  async updateSubmission(id: string, updates: Partial<HomeworkSubmission>): Promise<HomeworkSubmission> {
    const s = this.submissions.get(id); if (!s) throw new Error("Submission not found");
    const updated = { ...s, ...updates }; this.submissions.set(id, updated); return updated;
  }

  async getAllFinances() { return Array.from(this.finances.values()); }
  async getFinancesByStudent(studentId: string) { return Array.from(this.finances.values()).filter(f => f.studentId === studentId); }
  async createFinance(input: InsertFinance): Promise<Finance> {
    const id = randomUUID();
    const f: Finance = { ...input, id, paid: input.paid ?? 0, notes: input.notes || null, createdAt: new Date() };
    this.finances.set(id, f); return f;
  }
  async updateFinance(id: string, updates: Partial<Finance>): Promise<Finance> {
    const f = this.finances.get(id); if (!f) throw new Error("Finance not found");
    const updated = { ...f, ...updates }; this.finances.set(id, updated); return updated;
  }
  async deleteFinance(id: string) { return this.finances.delete(id); }
}

export const storage = new MemStorage();
