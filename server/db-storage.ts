import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  students, teachers, subjects, groups, enrollments, subscriptions,
  sessions, attendance, grades, homework, homeworkSubmissions, finances,
  studentNotes, exams, examQuestions, examSubmissions, automationRules,
  automationLogs, expenses, appSettings, users,
} from "@shared/schema";
import type {
  Student, InsertStudent, Teacher, InsertTeacher, Subject, InsertSubject,
  Group, InsertGroup, Enrollment, InsertEnrollment, Subscription, InsertSubscription,
  Session, InsertSession, Attendance, InsertAttendance, Grade, InsertGrade,
  Homework, InsertHomework, HomeworkSubmission, InsertHomeworkSubmission,
  Finance, InsertFinance, StudentNote, InsertStudentNote, Exam, InsertExam,
  ExamQuestion, InsertExamQuestion, ExamSubmission, InsertExamSubmission,
  AutomationRule, InsertAutomationRule, AutomationLog, InsertAutomationLog,
  Expense, InsertExpense, User, InsertUser,
} from "@shared/schema";

export class DatabaseStorage {

  private calcGrade(score: number, total: number, a = 90, b = 80, c = 70, d = 60): string {
    const p = (score / total) * 100;
    if (p >= a) return "A"; if (p >= b) return "B"; if (p >= c) return "C"; if (p >= d) return "D"; return "F";
  }

  private async getGradeThresholds() {
    const rows = await db.select().from(appSettings);
    const m = new Map(rows.map(r => [r.key, r.value]));
    return {
      a: parseInt(m.get("grade_a_min") || "90"),
      b: parseInt(m.get("grade_b_min") || "80"),
      c: parseInt(m.get("grade_c_min") || "70"),
      d: parseInt(m.get("grade_d_min") || "60"),
    };
  }

  private async generateStudentCode(): Promise<string> {
    const all = await db.select({ code: students.code }).from(students);
    // Sequential codes starting from 1001 — avoids random collisions entirely
    const numericCodes = all.map(s => s.code).filter(c => /^\d+$/.test(c)).map(Number);
    const next = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 1001;
    return String(next);
  }

  // ── Students ─────────────────────────────────────────────────────────────
  async getStudent(id: string): Promise<Student | undefined> {
    const r = await db.select().from(students).where(eq(students.id, id));
    return r[0];
  }
  async getStudentByCode(code: string): Promise<Student | undefined> {
    const r = await db.select().from(students).where(eq(students.code, code));
    return r[0];
  }
  async getAllStudents(): Promise<Student[]> {
    return db.select().from(students);
  }
  async createStudent(input: InsertStudent): Promise<Student> {
    const code = await this.generateStudentCode();
    const r = await db.insert(students).values({
      name: input.name,
      guardianPhone: input.guardianPhone,
      guardianPhone2: input.guardianPhone2 || null,
      address: input.address || null,
      gradeLevel: input.gradeLevel,
      section: input.section,
      groupId: input.groupId || null,
      code,
      status: "active",
      qrPath: null,
    }).returning();
    return r[0];
  }
  async updateStudent(id: string, u: Partial<Student>): Promise<Student> {
    const r = await db.update(students).set(u).where(eq(students.id, id)).returning();
    if (!r[0]) throw new Error("Student not found");
    return r[0];
  }
  async deleteStudent(id: string): Promise<boolean> {
    const r = await db.delete(students).where(eq(students.id, id)).returning();
    return r.length > 0;
  }

  // ── Teachers ─────────────────────────────────────────────────────────────
  async getAllTeachers(): Promise<Teacher[]> { return db.select().from(teachers); }
  async getTeacher(id: string): Promise<Teacher | undefined> {
    const r = await db.select().from(teachers).where(eq(teachers.id, id)); return r[0];
  }
  async createTeacher(input: InsertTeacher): Promise<Teacher> {
    const r = await db.insert(teachers).values({
      name: input.name, subject: input.subject, status: "active",
      phone: input.phone || null, email: input.email || null,
      salaryType: input.salaryType || "fixed", salaryAmount: input.salaryAmount ?? 0,
      notes: input.notes || null,
    }).returning(); return r[0];
  }
  async updateTeacher(id: string, u: Partial<Teacher>): Promise<Teacher> {
    const r = await db.update(teachers).set(u).where(eq(teachers.id, id)).returning();
    if (!r[0]) throw new Error("Teacher not found"); return r[0];
  }
  async deleteTeacher(id: string): Promise<boolean> {
    const r = await db.delete(teachers).where(eq(teachers.id, id)).returning(); return r.length > 0;
  }

  // ── Subjects ─────────────────────────────────────────────────────────────
  async getAllSubjects(): Promise<Subject[]> { return db.select().from(subjects); }
  async getSubject(id: string): Promise<Subject | undefined> {
    const r = await db.select().from(subjects).where(eq(subjects.id, id)); return r[0];
  }
  async createSubject(input: InsertSubject): Promise<Subject> {
    const r = await db.insert(subjects).values({
      name: input.name, description: input.description || null,
      teacherId: input.teacherId || null, price: input.price ?? 0,
      sessionsPerMonth: input.sessionsPerMonth ?? 4, color: input.color || "#6366f1",
    }).returning(); return r[0];
  }
  async updateSubject(id: string, u: Partial<Subject>): Promise<Subject> {
    const r = await db.update(subjects).set(u).where(eq(subjects.id, id)).returning();
    if (!r[0]) throw new Error("Subject not found"); return r[0];
  }
  async deleteSubject(id: string): Promise<boolean> {
    const r = await db.delete(subjects).where(eq(subjects.id, id)).returning(); return r.length > 0;
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  async getAllGroups(): Promise<Group[]> { return db.select().from(groups); }
  async getGroup(id: string): Promise<Group | undefined> {
    const r = await db.select().from(groups).where(eq(groups.id, id)); return r[0];
  }
  async createGroup(input: InsertGroup): Promise<Group> {
    const r = await db.insert(groups).values({
      name: input.name, gradeLevel: input.gradeLevel, section: input.section,
      subject: input.subject || null, teacherId: input.teacherId || null,
      capacity: input.capacity ?? 30, description: input.description || null, color: input.color || "#6366f1",
    }).returning(); return r[0];
  }
  async updateGroup(id: string, u: Partial<Group>): Promise<Group> {
    const r = await db.update(groups).set(u).where(eq(groups.id, id)).returning();
    if (!r[0]) throw new Error("Group not found"); return r[0];
  }
  async deleteGroup(id: string): Promise<boolean> {
    const r = await db.delete(groups).where(eq(groups.id, id)).returning(); return r.length > 0;
  }

  // ── Enrollments ───────────────────────────────────────────────────────────
  async getAllEnrollments(): Promise<Enrollment[]> { return db.select().from(enrollments); }
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }
  async getEnrollmentsByGroup(groupId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.groupId, groupId));
  }
  async getEnrollmentsByTeacher(teacherId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.teacherId, teacherId));
  }
  async createEnrollment(input: InsertEnrollment): Promise<Enrollment> {
    const r = await db.insert(enrollments).values({
      studentId: input.studentId, status: input.status || "active",
      subjectId: input.subjectId || null, teacherId: input.teacherId || null,
      groupId: input.groupId || null, notes: input.notes || null,
    }).returning(); return r[0];
  }
  async updateEnrollment(id: string, u: Partial<Enrollment>): Promise<Enrollment> {
    const r = await db.update(enrollments).set(u).where(eq(enrollments.id, id)).returning();
    if (!r[0]) throw new Error("Enrollment not found"); return r[0];
  }
  async deleteEnrollment(id: string): Promise<boolean> {
    const r = await db.delete(enrollments).where(eq(enrollments.id, id)).returning(); return r.length > 0;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  async getAllSubscriptions(): Promise<Subscription[]> { return db.select().from(subscriptions); }
  async getSubscriptionsByStudent(studentId: string): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.studentId, studentId));
  }
  async createSubscription(input: InsertSubscription): Promise<Subscription> {
    const r = await db.insert(subscriptions).values({
      studentId: input.studentId, amount: input.amount, startDate: input.startDate,
      status: input.status || "active", enrollmentId: input.enrollmentId || null,
      subjectId: input.subjectId || null, teacherId: input.teacherId || null,
      paid: input.paid ?? 0, endDate: input.endDate || null, notes: input.notes || null,
    }).returning(); return r[0];
  }
  async updateSubscription(id: string, u: Partial<Subscription>): Promise<Subscription> {
    const r = await db.update(subscriptions).set(u).where(eq(subscriptions.id, id)).returning();
    if (!r[0]) throw new Error("Subscription not found"); return r[0];
  }
  async deleteSubscription(id: string): Promise<boolean> {
    const r = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning(); return r.length > 0;
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  async getSession(id: string): Promise<Session | undefined> {
    const r = await db.select().from(sessions).where(eq(sessions.id, id)); return r[0];
  }
  async getAllSessions(): Promise<Session[]> { return db.select().from(sessions); }
  async getActiveSession(): Promise<Session | undefined> {
    const r = await db.select().from(sessions).where(eq(sessions.status, "active")); return r[0];
  }
  async createSession(input: InsertSession): Promise<Session> {
    const r = await db.insert(sessions).values({
      name: input.name, date: input.date, time: input.time, duration: input.duration,
      status: "scheduled", groupId: input.groupId || null,
      teacherId: input.teacherId || null, subjectId: input.subjectId || null,
    }).returning(); return r[0];
  }
  async updateSession(id: string, u: Partial<Session>): Promise<Session> {
    const r = await db.update(sessions).set(u).where(eq(sessions.id, id)).returning();
    if (!r[0]) throw new Error("Session not found"); return r[0];
  }
  async deleteSession(id: string): Promise<boolean> {
    const r = await db.delete(sessions).where(eq(sessions.id, id)).returning();
    return r.length > 0;
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  async getAllAttendance(): Promise<Attendance[]> {
    return db.select().from(attendance);
  }
  async getAttendanceBySession(sessionId: string): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }
  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }
  async getAttendanceRecord(studentId: string, sessionId: string): Promise<Attendance | undefined> {
    const r = await db.select().from(attendance).where(
      and(eq(attendance.studentId, studentId), eq(attendance.sessionId, sessionId))
    ); return r[0];
  }
  async createAttendance(input: InsertAttendance): Promise<Attendance> {
    const r = await db.insert(attendance).values(input).returning(); return r[0];
  }
  async updateAttendance(id: string, u: Partial<Attendance>): Promise<Attendance> {
    const r = await db.update(attendance).set(u).where(eq(attendance.id, id)).returning();
    if (!r[0]) throw new Error("Attendance record not found");
    return r[0];
  }
  async deleteAttendance(id: string): Promise<boolean> {
    const r = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    return r.length > 0;
  }

  // ── Grades ────────────────────────────────────────────────────────────────
  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.studentId, studentId));
  }
  async getAllGrades(): Promise<Grade[]> { return db.select().from(grades); }
  async createGrade(input: InsertGrade): Promise<Grade> {
    const t = await this.getGradeThresholds();
    const gradeVal = this.calcGrade(input.score, input.totalMarks, t.a, t.b, t.c, t.d);
    const r = await db.insert(grades).values({
      studentId: input.studentId, subject: input.subject,
      assessmentType: input.assessmentType, score: input.score,
      totalMarks: input.totalMarks, weight: input.weight ?? 1.0,
      notes: input.notes || null, grade: gradeVal, sentToParent: false,
    }).returning(); return r[0];
  }
  async updateGrade(id: string, u: Partial<Grade>): Promise<Grade> {
    if (u.score !== undefined || u.totalMarks !== undefined) {
      const existing = await db.select().from(grades).where(eq(grades.id, id));
      if (existing[0]) {
        const t = await this.getGradeThresholds();
        u.grade = this.calcGrade(u.score ?? existing[0].score, u.totalMarks ?? existing[0].totalMarks, t.a, t.b, t.c, t.d);
      }
    }
    const r = await db.update(grades).set(u).where(eq(grades.id, id)).returning();
    if (!r[0]) throw new Error("Grade not found"); return r[0];
  }
  async deleteGrade(id: string): Promise<boolean> {
    const r = await db.delete(grades).where(eq(grades.id, id)).returning(); return r.length > 0;
  }

  // ── Homework ──────────────────────────────────────────────────────────────
  async getAllHomework(): Promise<Homework[]> { return db.select().from(homework); }
  async getHomework(id: string): Promise<Homework | undefined> {
    const r = await db.select().from(homework).where(eq(homework.id, id)); return r[0];
  }
  async createHomework(input: InsertHomework): Promise<Homework> {
    const r = await db.insert(homework).values({
      title: input.title, subject: input.subject, deadline: input.deadline,
      status: "active", description: input.description || null,
      groupId: input.groupId || null, totalMarks: input.totalMarks ?? 10,
    }).returning(); return r[0];
  }
  async updateHomework(id: string, u: Partial<Homework>): Promise<Homework> {
    const r = await db.update(homework).set(u).where(eq(homework.id, id)).returning();
    if (!r[0]) throw new Error("Homework not found"); return r[0];
  }
  async deleteHomework(id: string): Promise<boolean> {
    const r = await db.delete(homework).where(eq(homework.id, id)).returning(); return r.length > 0;
  }
  async getSubmissionsByHomework(homeworkId: string): Promise<HomeworkSubmission[]> {
    return db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, homeworkId));
  }
  async getSubmissionsByStudent(studentId: string): Promise<HomeworkSubmission[]> {
    return db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.studentId, studentId));
  }
  async createSubmission(input: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const r = await db.insert(homeworkSubmissions).values({
      homeworkId: input.homeworkId, studentId: input.studentId,
      status: input.status || "pending", score: input.score ?? null, notes: input.notes || null,
    }).returning(); return r[0];
  }
  async updateSubmission(id: string, u: Partial<HomeworkSubmission>): Promise<HomeworkSubmission> {
    const r = await db.update(homeworkSubmissions).set(u).where(eq(homeworkSubmissions.id, id)).returning();
    if (!r[0]) throw new Error("Submission not found"); return r[0];
  }

  // ── Finances ──────────────────────────────────────────────────────────────
  async getAllFinances(): Promise<Finance[]> { return db.select().from(finances); }
  async getFinancesByStudent(studentId: string): Promise<Finance[]> {
    return db.select().from(finances).where(eq(finances.studentId, studentId));
  }
  async createFinance(input: InsertFinance): Promise<Finance> {
    const r = await db.insert(finances).values({
      studentId: input.studentId, type: input.type || "subscription",
      amount: input.amount, dueDate: input.dueDate, status: input.status || "pending",
      paid: input.paid ?? 0, notes: input.notes || null,
    }).returning(); return r[0];
  }
  async updateFinance(id: string, u: Partial<Finance>): Promise<Finance> {
    const r = await db.update(finances).set(u).where(eq(finances.id, id)).returning();
    if (!r[0]) throw new Error("Finance not found"); return r[0];
  }
  async deleteFinance(id: string): Promise<boolean> {
    const r = await db.delete(finances).where(eq(finances.id, id)).returning(); return r.length > 0;
  }

  // ── Student Notes ─────────────────────────────────────────────────────────
  async getNotesByStudent(studentId: string): Promise<StudentNote[]> {
    return db.select().from(studentNotes).where(eq(studentNotes.studentId, studentId));
  }
  async createNote(input: InsertStudentNote): Promise<StudentNote> {
    const r = await db.insert(studentNotes).values(input).returning(); return r[0];
  }
  async deleteNote(id: string): Promise<boolean> {
    const r = await db.delete(studentNotes).where(eq(studentNotes.id, id)).returning(); return r.length > 0;
  }

  // ── Exams ─────────────────────────────────────────────────────────────────
  async getAllExams(): Promise<Exam[]> { return db.select().from(exams); }
  async getExam(id: string): Promise<Exam | undefined> {
    const r = await db.select().from(exams).where(eq(exams.id, id)); return r[0];
  }
  async createExam(input: InsertExam): Promise<Exam> {
    const r = await db.insert(exams).values({
      title: input.title, subject: input.subject, date: input.date, status: "draft",
      groupId: input.groupId || null, duration: input.duration ?? 60, description: input.description || null,
    }).returning(); return r[0];
  }
  async updateExam(id: string, u: Partial<Exam>): Promise<Exam> {
    const r = await db.update(exams).set(u).where(eq(exams.id, id)).returning();
    if (!r[0]) throw new Error("Exam not found"); return r[0];
  }
  async deleteExam(id: string): Promise<boolean> {
    const r = await db.delete(exams).where(eq(exams.id, id)).returning(); return r.length > 0;
  }
  async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    return db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
  }
  async createExamQuestion(input: InsertExamQuestion): Promise<ExamQuestion> {
    const r = await db.insert(examQuestions).values({
      examId: input.examId, question: input.question, type: input.type || "short",
      marks: input.marks ?? 5, options: input.options || null,
      correctAnswer: input.correctAnswer || null, orderIndex: input.orderIndex ?? 0,
    }).returning(); return r[0];
  }
  async deleteExamQuestion(id: string): Promise<boolean> {
    const r = await db.delete(examQuestions).where(eq(examQuestions.id, id)).returning(); return r.length > 0;
  }
  async getExamSubmissions(examId: string): Promise<ExamSubmission[]> {
    return db.select().from(examSubmissions).where(eq(examSubmissions.examId, examId));
  }
  async createExamSubmission(input: InsertExamSubmission): Promise<ExamSubmission> {
    const r = await db.insert(examSubmissions).values({
      examId: input.examId, studentId: input.studentId, status: input.status || "pending",
      score: input.score ?? null, gradedAt: null,
    }).returning(); return r[0];
  }
  async updateExamSubmission(id: string, u: Partial<ExamSubmission>): Promise<ExamSubmission> {
    const r = await db.update(examSubmissions).set(u).where(eq(examSubmissions.id, id)).returning();
    if (!r[0]) throw new Error("Submission not found"); return r[0];
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  private readonly defaultSettings: Record<string, string> = {
    app_name: "نظام المدرسة", semester_start: "2025-09-01", semester_end: "2026-06-30",
    grade_a_min: "90", grade_b_min: "80", grade_c_min: "70", grade_d_min: "60",
    currency: "ج", primary_color: "#6366f1",
  };

  async getSetting(key: string): Promise<string | undefined> {
    const r = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return r[0]?.value ?? this.defaultSettings[key];
  }
  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings).values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value } });
  }
  async getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(appSettings);
    const result = { ...this.defaultSettings };
    rows.forEach(r => { result[r.key] = r.value; });
    return result;
  }

  // ── Automation Rules ──────────────────────────────────────────────────────
  async getAllAutomationRules(): Promise<AutomationRule[]> {
    return db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
  }
  async getAutomationRule(id: string): Promise<AutomationRule | undefined> {
    const r = await db.select().from(automationRules).where(eq(automationRules.id, id)); return r[0];
  }
  async createAutomationRule(input: InsertAutomationRule): Promise<AutomationRule> {
    const r = await db.insert(automationRules).values({
      name: input.name, trigger: input.trigger, messageTemplate: input.messageTemplate,
      status: "active", runCount: 0, lastRun: null,
      description: input.description || null, triggerConfig: input.triggerConfig || null,
      targetGroup: input.targetGroup || null,
    }).returning(); return r[0];
  }
  async updateAutomationRule(id: string, u: Partial<AutomationRule>): Promise<AutomationRule> {
    const r = await db.update(automationRules).set(u).where(eq(automationRules.id, id)).returning();
    if (!r[0]) throw new Error("Rule not found"); return r[0];
  }
  async deleteAutomationRule(id: string): Promise<boolean> {
    const r = await db.delete(automationRules).where(eq(automationRules.id, id)).returning(); return r.length > 0;
  }

  // ── Automation Logs ───────────────────────────────────────────────────────
  async getAllAutomationLogs(): Promise<AutomationLog[]> {
    return db.select().from(automationLogs).orderBy(desc(automationLogs.createdAt));
  }
  async getLogsByRule(ruleId: string): Promise<AutomationLog[]> {
    return db.select().from(automationLogs).where(eq(automationLogs.ruleId, ruleId));
  }
  async createAutomationLog(input: InsertAutomationLog): Promise<AutomationLog> {
    const r = await db.insert(automationLogs).values({
      ruleId: input.ruleId, status: input.status || "sent",
      ruleName: input.ruleName || null, studentId: input.studentId || null,
      phone: input.phone || null, message: input.message || null, reason: input.reason || null,
    }).returning(); return r[0];
  }
  async clearAutomationLogs(): Promise<void> { await db.delete(automationLogs); }

  // ── Expenses ──────────────────────────────────────────────────────────────
  async getAllExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }
  async getExpense(id: string): Promise<Expense | undefined> {
    const r = await db.select().from(expenses).where(eq(expenses.id, id)); return r[0];
  }
  async createExpense(input: InsertExpense): Promise<Expense> {
    const r = await db.insert(expenses).values({
      category: input.category, amount: input.amount, date: input.date,
      description: input.description || null,
    }).returning(); return r[0];
  }
  async updateExpense(id: string, u: Partial<Expense>): Promise<Expense> {
    const r = await db.update(expenses).set(u).where(eq(expenses.id, id)).returning();
    if (!r[0]) throw new Error("Expense not found"); return r[0];
  }
  async deleteExpense(id: string): Promise<boolean> {
    const r = await db.delete(expenses).where(eq(expenses.id, id)).returning(); return r.length > 0;
  }

  // ── Users (Auth) ───────────────────────────────────────────────────────────
  async getAllUsers(): Promise<User[]> { return db.select().from(users); }
  async getUserById(id: string): Promise<User | undefined> {
    const r = await db.select().from(users).where(eq(users.id, id)); return r[0];
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const r = await db.select().from(users).where(eq(users.email, email)); return r[0];
  }
  async createUser(input: InsertUser): Promise<User> {
    const r = await db.insert(users).values(input).returning(); return r[0];
  }
  async updateUser(id: string, u: Partial<User>): Promise<User> {
    const r = await db.update(users).set(u).where(eq(users.id, id)).returning();
    if (!r[0]) throw new Error("User not found"); return r[0];
  }
  async deleteUser(id: string): Promise<boolean> {
    const r = await db.delete(users).where(eq(users.id, id)).returning(); return r.length > 0;
  }
  async countUsers(): Promise<number> {
    const r = await db.select().from(users); return r.length;
  }
}
