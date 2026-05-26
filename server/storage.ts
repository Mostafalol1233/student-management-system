import {
  type Student, type InsertStudent,
  type Group, type InsertGroup,
  type Session, type InsertSession,
  type Attendance, type InsertAttendance,
  type Grade, type InsertGrade,
  type Homework, type InsertHomework,
  type HomeworkSubmission, type InsertHomeworkSubmission,
  type Finance, type InsertFinance,
  type StudentNote, type InsertStudentNote,
  type Exam, type InsertExam,
  type ExamQuestion, type InsertExamQuestion,
  type ExamSubmission, type InsertExamSubmission,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByCode(code: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(s: InsertStudent): Promise<Student>;
  updateStudent(id: string, u: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<boolean>;

  // Groups
  getAllGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(g: InsertGroup): Promise<Group>;
  updateGroup(id: string, u: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getActiveSession(): Promise<Session | undefined>;
  createSession(s: InsertSession): Promise<Session>;
  updateSession(id: string, u: Partial<Session>): Promise<Session>;

  // Attendance
  getAttendanceBySession(sessionId: string): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  createAttendance(a: InsertAttendance): Promise<Attendance>;
  getAttendanceRecord(studentId: string, sessionId: string): Promise<Attendance | undefined>;

  // Grades
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getAllGrades(): Promise<Grade[]>;
  createGrade(g: InsertGrade): Promise<Grade>;
  updateGrade(id: string, u: Partial<Grade>): Promise<Grade>;
  deleteGrade(id: string): Promise<boolean>;

  // Homework
  getAllHomework(): Promise<Homework[]>;
  getHomework(id: string): Promise<Homework | undefined>;
  createHomework(h: InsertHomework): Promise<Homework>;
  updateHomework(id: string, u: Partial<Homework>): Promise<Homework>;
  deleteHomework(id: string): Promise<boolean>;
  getSubmissionsByHomework(homeworkId: string): Promise<HomeworkSubmission[]>;
  getSubmissionsByStudent(studentId: string): Promise<HomeworkSubmission[]>;
  createSubmission(s: InsertHomeworkSubmission): Promise<HomeworkSubmission>;
  updateSubmission(id: string, u: Partial<HomeworkSubmission>): Promise<HomeworkSubmission>;

  // Finances
  getAllFinances(): Promise<Finance[]>;
  getFinancesByStudent(studentId: string): Promise<Finance[]>;
  createFinance(f: InsertFinance): Promise<Finance>;
  updateFinance(id: string, u: Partial<Finance>): Promise<Finance>;
  deleteFinance(id: string): Promise<boolean>;

  // Student Notes
  getNotesByStudent(studentId: string): Promise<StudentNote[]>;
  createNote(n: InsertStudentNote): Promise<StudentNote>;
  deleteNote(id: string): Promise<boolean>;

  // Exams
  getAllExams(): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  createExam(e: InsertExam): Promise<Exam>;
  updateExam(id: string, u: Partial<Exam>): Promise<Exam>;
  deleteExam(id: string): Promise<boolean>;
  getExamQuestions(examId: string): Promise<ExamQuestion[]>;
  createExamQuestion(q: InsertExamQuestion): Promise<ExamQuestion>;
  deleteExamQuestion(id: string): Promise<boolean>;
  getExamSubmissions(examId: string): Promise<ExamSubmission[]>;
  createExamSubmission(s: InsertExamSubmission): Promise<ExamSubmission>;
  updateExamSubmission(id: string, u: Partial<ExamSubmission>): Promise<ExamSubmission>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;
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
  private notes = new Map<string, StudentNote>();
  private exams = new Map<string, Exam>();
  private examQuestions = new Map<string, ExamQuestion>();
  private examSubmissions = new Map<string, ExamSubmission>();
  private settings = new Map<string, string>([
    ["app_name", "نظام المدرسة"],
    ["semester_start", "2025-09-01"],
    ["semester_end", "2026-06-30"],
    ["grade_a_min", "90"],
    ["grade_b_min", "80"],
    ["grade_c_min", "70"],
    ["grade_d_min", "60"],
    ["currency", "ج"],
    ["primary_color", "#3b82f6"],
  ]);

  private generateStudentCode(): string {
    let code: string;
    do { code = Math.floor(100 + Math.random() * 900).toString(); }
    while (Array.from(this.students.values()).some(s => s.code === code));
    return code;
  }

  private calcGrade(score: number, total: number): string {
    const p = (score / total) * 100;
    const a = parseInt(this.settings.get("grade_a_min") || "90");
    const b = parseInt(this.settings.get("grade_b_min") || "80");
    const c = parseInt(this.settings.get("grade_c_min") || "70");
    const d = parseInt(this.settings.get("grade_d_min") || "60");
    if (p >= a) return "A"; if (p >= b) return "B"; if (p >= c) return "C"; if (p >= d) return "D"; return "F";
  }

  // Students
  async getStudent(id: string) { return this.students.get(id); }
  async getStudentByCode(code: string) { return Array.from(this.students.values()).find(s => s.code === code); }
  async getAllStudents() { return Array.from(this.students.values()); }
  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const s: Student = { ...input, id, code: this.generateStudentCode(), guardianPhone2: input.guardianPhone2 || null, address: input.address || null, groupId: input.groupId || null, qrPath: null, status: "active", createdAt: new Date() };
    this.students.set(id, s); return s;
  }
  async updateStudent(id: string, u: Partial<Student>): Promise<Student> {
    const s = this.students.get(id); if (!s) throw new Error("Student not found");
    const updated = { ...s, ...u }; this.students.set(id, updated); return updated;
  }
  async deleteStudent(id: string) { return this.students.delete(id); }

  // Groups
  async getAllGroups() { return Array.from(this.groups.values()); }
  async getGroup(id: string) { return this.groups.get(id); }
  async createGroup(input: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const g: Group = { ...input, id, subject: input.subject || null, description: input.description || null, color: input.color || "#3b82f6", createdAt: new Date() };
    this.groups.set(id, g); return g;
  }
  async updateGroup(id: string, u: Partial<Group>): Promise<Group> {
    const g = this.groups.get(id); if (!g) throw new Error("Group not found");
    const updated = { ...g, ...u }; this.groups.set(id, updated); return updated;
  }
  async deleteGroup(id: string) { return this.groups.delete(id); }

  // Sessions
  async getSession(id: string) { return this.sessions.get(id); }
  async getAllSessions() { return Array.from(this.sessions.values()); }
  async getActiveSession() { return Array.from(this.sessions.values()).find(s => s.status === "active"); }
  async createSession(input: InsertSession): Promise<Session> {
    const id = randomUUID();
    const s: Session = { ...input, id, groupId: input.groupId || null, status: "scheduled", createdAt: new Date() };
    this.sessions.set(id, s); return s;
  }
  async updateSession(id: string, u: Partial<Session>): Promise<Session> {
    const s = this.sessions.get(id); if (!s) throw new Error("Session not found");
    const updated = { ...s, ...u }; this.sessions.set(id, updated); return updated;
  }

  // Attendance
  async getAttendanceBySession(sessionId: string) { return Array.from(this.attendance.values()).filter(a => a.sessionId === sessionId); }
  async getAttendanceByStudent(studentId: string) { return Array.from(this.attendance.values()).filter(a => a.studentId === studentId); }
  async getAttendanceRecord(studentId: string, sessionId: string) { return Array.from(this.attendance.values()).find(a => a.studentId === studentId && a.sessionId === sessionId); }
  async createAttendance(input: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const a: Attendance = { ...input, id, timeRecorded: new Date() };
    this.attendance.set(id, a); return a;
  }

  // Grades
  async getGradesByStudent(studentId: string) { return Array.from(this.grades.values()).filter(g => g.studentId === studentId); }
  async getAllGrades() { return Array.from(this.grades.values()); }
  async createGrade(input: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const g: Grade = { ...input, id, notes: input.notes || null, weight: input.weight ?? 1.0, grade: this.calcGrade(input.score, input.totalMarks), sentToParent: false, createdAt: new Date() };
    this.grades.set(id, g); return g;
  }
  async updateGrade(id: string, u: Partial<Grade>): Promise<Grade> {
    const g = this.grades.get(id); if (!g) throw new Error("Grade not found");
    const updated = { ...g, ...u };
    if (u.score !== undefined || u.totalMarks !== undefined) updated.grade = this.calcGrade(updated.score, updated.totalMarks);
    this.grades.set(id, updated); return updated;
  }
  async deleteGrade(id: string) { return this.grades.delete(id); }

  // Homework
  async getAllHomework() { return Array.from(this.homework.values()); }
  async getHomework(id: string) { return this.homework.get(id); }
  async createHomework(input: InsertHomework): Promise<Homework> {
    const id = randomUUID();
    const h: Homework = { ...input, id, description: input.description || null, groupId: input.groupId || null, totalMarks: input.totalMarks ?? 10, status: "active", createdAt: new Date() };
    this.homework.set(id, h); return h;
  }
  async updateHomework(id: string, u: Partial<Homework>): Promise<Homework> {
    const h = this.homework.get(id); if (!h) throw new Error("Homework not found");
    const updated = { ...h, ...u }; this.homework.set(id, updated); return updated;
  }
  async deleteHomework(id: string) { return this.homework.delete(id); }
  async getSubmissionsByHomework(homeworkId: string) { return Array.from(this.submissions.values()).filter(s => s.homeworkId === homeworkId); }
  async getSubmissionsByStudent(studentId: string) { return Array.from(this.submissions.values()).filter(s => s.studentId === studentId); }
  async createSubmission(input: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const id = randomUUID();
    const s: HomeworkSubmission = { ...input, id, score: input.score ?? null, notes: input.notes || null, submittedAt: new Date() };
    this.submissions.set(id, s); return s;
  }
  async updateSubmission(id: string, u: Partial<HomeworkSubmission>): Promise<HomeworkSubmission> {
    const s = this.submissions.get(id); if (!s) throw new Error("Submission not found");
    const updated = { ...s, ...u }; this.submissions.set(id, updated); return updated;
  }

  // Finances
  async getAllFinances() { return Array.from(this.finances.values()); }
  async getFinancesByStudent(studentId: string) { return Array.from(this.finances.values()).filter(f => f.studentId === studentId); }
  async createFinance(input: InsertFinance): Promise<Finance> {
    const id = randomUUID();
    const f: Finance = { ...input, id, paid: input.paid ?? 0, notes: input.notes || null, createdAt: new Date() };
    this.finances.set(id, f); return f;
  }
  async updateFinance(id: string, u: Partial<Finance>): Promise<Finance> {
    const f = this.finances.get(id); if (!f) throw new Error("Finance not found");
    const updated = { ...f, ...u }; this.finances.set(id, updated); return updated;
  }
  async deleteFinance(id: string) { return this.finances.delete(id); }

  // Student Notes
  async getNotesByStudent(studentId: string) { return Array.from(this.notes.values()).filter(n => n.studentId === studentId).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()); }
  async createNote(input: InsertStudentNote): Promise<StudentNote> {
    const id = randomUUID();
    const n: StudentNote = { ...input, id, createdAt: new Date() };
    this.notes.set(id, n); return n;
  }
  async deleteNote(id: string) { return this.notes.delete(id); }

  // Exams
  async getAllExams() { return Array.from(this.exams.values()); }
  async getExam(id: string) { return this.exams.get(id); }
  async createExam(input: InsertExam): Promise<Exam> {
    const id = randomUUID();
    const e: Exam = { ...input, id, groupId: input.groupId || null, duration: input.duration ?? 60, description: input.description || null, status: "draft", createdAt: new Date() };
    this.exams.set(id, e); return e;
  }
  async updateExam(id: string, u: Partial<Exam>): Promise<Exam> {
    const e = this.exams.get(id); if (!e) throw new Error("Exam not found");
    const updated = { ...e, ...u }; this.exams.set(id, updated); return updated;
  }
  async deleteExam(id: string) { return this.exams.delete(id); }
  async getExamQuestions(examId: string) { return Array.from(this.examQuestions.values()).filter(q => q.examId === examId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)); }
  async createExamQuestion(input: InsertExamQuestion): Promise<ExamQuestion> {
    const id = randomUUID();
    const q: ExamQuestion = { ...input, id, options: input.options || null, correctAnswer: input.correctAnswer || null, orderIndex: input.orderIndex ?? 0 };
    this.examQuestions.set(id, q); return q;
  }
  async deleteExamQuestion(id: string) { return this.examQuestions.delete(id); }
  async getExamSubmissions(examId: string) { return Array.from(this.examSubmissions.values()).filter(s => s.examId === examId); }
  async createExamSubmission(input: InsertExamSubmission): Promise<ExamSubmission> {
    const id = randomUUID();
    const s: ExamSubmission = { ...input, id, score: input.score ?? null, gradedAt: null, createdAt: new Date() };
    this.examSubmissions.set(id, s); return s;
  }
  async updateExamSubmission(id: string, u: Partial<ExamSubmission>): Promise<ExamSubmission> {
    const s = this.examSubmissions.get(id); if (!s) throw new Error("Submission not found");
    const updated = { ...s, ...u }; this.examSubmissions.set(id, updated); return updated;
  }

  // Settings
  async getSetting(key: string) { return this.settings.get(key); }
  async setSetting(key: string, value: string) { this.settings.set(key, value); }
  async getAllSettings(): Promise<Record<string, string>> {
    const obj: Record<string, string> = {};
    this.settings.forEach((v, k) => { obj[k] = v; });
    return obj;
  }
}

export const storage = new MemStorage();
