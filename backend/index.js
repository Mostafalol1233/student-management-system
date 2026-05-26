var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appSettings: () => appSettings,
  attendance: () => attendance,
  auditLogs: () => auditLogs,
  automationLogs: () => automationLogs,
  automationRules: () => automationRules,
  enrollments: () => enrollments,
  examQuestions: () => examQuestions,
  examSubmissions: () => examSubmissions,
  exams: () => exams,
  expenses: () => expenses,
  finances: () => finances,
  grades: () => grades,
  groups: () => groups,
  homework: () => homework,
  homeworkSubmissions: () => homeworkSubmissions,
  insertAttendanceSchema: () => insertAttendanceSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertAutomationLogSchema: () => insertAutomationLogSchema,
  insertAutomationRuleSchema: () => insertAutomationRuleSchema,
  insertEnrollmentSchema: () => insertEnrollmentSchema,
  insertExamQuestionSchema: () => insertExamQuestionSchema,
  insertExamSchema: () => insertExamSchema,
  insertExamSubmissionSchema: () => insertExamSubmissionSchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertFinanceSchema: () => insertFinanceSchema,
  insertGradeSchema: () => insertGradeSchema,
  insertGroupSchema: () => insertGroupSchema,
  insertHomeworkSchema: () => insertHomeworkSchema,
  insertHomeworkSubmissionSchema: () => insertHomeworkSubmissionSchema,
  insertSessionSchema: () => insertSessionSchema,
  insertStudentNoteSchema: () => insertStudentNoteSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertTeacherSchema: () => insertTeacherSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  sessions: () => sessions,
  studentNotes: () => studentNotes,
  students: () => students,
  subjects: () => subjects,
  subscriptions: () => subscriptions,
  teachers: () => teachers,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var students, teachers, subjects, groups, enrollments, subscriptions, sessions, attendance, grades, homework, homeworkSubmissions, finances, studentNotes, exams, examQuestions, examSubmissions, expenses, auditLogs, automationRules, automationLogs, appSettings, users, insertStudentSchema, insertTeacherSchema, insertSubjectSchema, insertGroupSchema, insertEnrollmentSchema, insertSubscriptionSchema, insertSessionSchema, insertAttendanceSchema, insertGradeSchema, insertHomeworkSchema, insertHomeworkSubmissionSchema, insertFinanceSchema, insertStudentNoteSchema, insertExamSchema, insertExamQuestionSchema, insertExamSubmissionSchema, insertExpenseSchema, insertAuditLogSchema, insertAutomationRuleSchema, insertAutomationLogSchema, insertUserSchema, loginSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    students = pgTable("students", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      guardianPhone: text("guardian_phone").notNull(),
      guardianPhone2: text("guardian_phone2"),
      address: text("address"),
      code: text("code").notNull().unique(),
      gradeLevel: text("grade_level").notNull(),
      section: text("section").notNull(),
      groupId: varchar("group_id"),
      qrPath: text("qr_path"),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at").defaultNow()
    });
    teachers = pgTable("teachers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      subject: text("subject").notNull(),
      phone: text("phone"),
      email: text("email"),
      salaryType: text("salary_type").notNull().default("fixed"),
      salaryAmount: real("salary_amount").default(0),
      notes: text("notes"),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at").defaultNow()
    });
    subjects = pgTable("subjects", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      teacherId: varchar("teacher_id"),
      price: real("price").default(0),
      sessionsPerMonth: integer("sessions_per_month").default(4),
      color: text("color").default("#6366f1"),
      createdAt: timestamp("created_at").defaultNow()
    });
    groups = pgTable("groups", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      gradeLevel: text("grade_level").notNull(),
      section: text("section").notNull(),
      subject: text("subject"),
      teacherId: varchar("teacher_id"),
      capacity: integer("capacity").default(30),
      description: text("description"),
      color: text("color").default("#6366f1"),
      createdAt: timestamp("created_at").defaultNow()
    });
    enrollments = pgTable("enrollments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      subjectId: varchar("subject_id"),
      teacherId: varchar("teacher_id"),
      groupId: varchar("group_id"),
      status: text("status").notNull().default("active"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    subscriptions = pgTable("subscriptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      enrollmentId: varchar("enrollment_id"),
      subjectId: varchar("subject_id"),
      teacherId: varchar("teacher_id"),
      amount: real("amount").notNull(),
      paid: real("paid").default(0),
      startDate: text("start_date").notNull(),
      endDate: text("end_date"),
      status: text("status").notNull().default("active"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    sessions = pgTable("sessions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      date: text("date").notNull(),
      time: text("time").notNull(),
      duration: integer("duration").notNull(),
      groupId: varchar("group_id"),
      teacherId: varchar("teacher_id"),
      subjectId: varchar("subject_id"),
      status: text("status").notNull().default("scheduled"),
      createdAt: timestamp("created_at").defaultNow()
    });
    attendance = pgTable("attendance", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      sessionId: varchar("session_id").notNull().references(() => sessions.id),
      status: text("status").notNull(),
      timeRecorded: timestamp("time_recorded").defaultNow(),
      scanMethod: text("scan_method").notNull()
    });
    grades = pgTable("grades", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      subject: text("subject").notNull(),
      assessmentType: text("assessment_type").notNull(),
      score: integer("score").notNull(),
      totalMarks: integer("total_marks").notNull(),
      weight: real("weight").default(1),
      grade: text("grade"),
      notes: text("notes"),
      sentToParent: boolean("sent_to_parent").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    homework = pgTable("homework", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      description: text("description"),
      subject: text("subject").notNull(),
      groupId: varchar("group_id"),
      deadline: text("deadline").notNull(),
      totalMarks: integer("total_marks").default(10),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at").defaultNow()
    });
    homeworkSubmissions = pgTable("homework_submissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      homeworkId: varchar("homework_id").notNull().references(() => homework.id),
      studentId: varchar("student_id").notNull().references(() => students.id),
      score: integer("score"),
      status: text("status").notNull().default("pending"),
      notes: text("notes"),
      submittedAt: timestamp("submitted_at").defaultNow()
    });
    finances = pgTable("finances", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      type: text("type").notNull().default("subscription"),
      amount: real("amount").notNull(),
      paid: real("paid").default(0),
      dueDate: text("due_date").notNull(),
      status: text("status").notNull().default("pending"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    studentNotes = pgTable("student_notes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      studentId: varchar("student_id").notNull().references(() => students.id),
      content: text("content").notNull(),
      type: text("type").notNull().default("general"),
      createdAt: timestamp("created_at").defaultNow()
    });
    exams = pgTable("exams", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      subject: text("subject").notNull(),
      groupId: varchar("group_id"),
      date: text("date").notNull(),
      duration: integer("duration").default(60),
      status: text("status").notNull().default("draft"),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    examQuestions = pgTable("exam_questions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      examId: varchar("exam_id").notNull().references(() => exams.id),
      question: text("question").notNull(),
      type: text("type").notNull().default("short"),
      options: text("options"),
      correctAnswer: text("correct_answer"),
      marks: integer("marks").notNull().default(5),
      orderIndex: integer("order_index").default(0)
    });
    examSubmissions = pgTable("exam_submissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      examId: varchar("exam_id").notNull().references(() => exams.id),
      studentId: varchar("student_id").notNull().references(() => students.id),
      score: integer("score"),
      status: text("status").notNull().default("pending"),
      gradedAt: timestamp("graded_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    expenses = pgTable("expenses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      category: text("category").notNull(),
      amount: real("amount").notNull(),
      date: text("date").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      entity: text("entity").notNull(),
      entityId: varchar("entity_id"),
      action: text("action").notNull(),
      actor: text("actor").default("admin"),
      details: text("details"),
      createdAt: timestamp("created_at").defaultNow()
    });
    automationRules = pgTable("automation_rules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      trigger: text("trigger").notNull(),
      triggerConfig: text("trigger_config"),
      messageTemplate: text("message_template").notNull(),
      targetGroup: text("target_group"),
      status: text("status").notNull().default("active"),
      runCount: integer("run_count").default(0),
      lastRun: timestamp("last_run"),
      createdAt: timestamp("created_at").defaultNow()
    });
    automationLogs = pgTable("automation_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ruleId: varchar("rule_id").notNull(),
      ruleName: text("rule_name"),
      studentId: varchar("student_id"),
      phone: text("phone"),
      message: text("message"),
      status: text("status").notNull().default("sent"),
      reason: text("reason"),
      createdAt: timestamp("created_at").defaultNow()
    });
    appSettings = pgTable("app_settings", {
      key: text("key").primaryKey(),
      value: text("value").notNull()
    });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      role: text("role").notNull().default("reception"),
      teacherId: varchar("teacher_id"),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, code: true, qrPath: true, status: true });
    insertTeacherSchema = createInsertSchema(teachers).omit({ id: true, createdAt: true, status: true });
    insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
    insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
    insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, createdAt: true });
    insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
    insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true, status: true });
    insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, timeRecorded: true });
    insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true, grade: true, sentToParent: true });
    insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true, status: true });
    insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({ id: true, submittedAt: true });
    insertFinanceSchema = createInsertSchema(finances).omit({ id: true, createdAt: true });
    insertStudentNoteSchema = createInsertSchema(studentNotes).omit({ id: true, createdAt: true });
    insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, status: true });
    insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true });
    insertExamSubmissionSchema = createInsertSchema(examSubmissions).omit({ id: true, createdAt: true, gradedAt: true });
    insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
    insertAutomationRuleSchema = createInsertSchema(automationRules).omit({ id: true, createdAt: true, runCount: true, lastRun: true, status: true });
    insertAutomationLogSchema = createInsertSchema(automationLogs).omit({ id: true, createdAt: true });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
    loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
init_schema();
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Ensure the database is provisioned.");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/db-storage.ts
init_schema();
import { eq, and, desc } from "drizzle-orm";
var DatabaseStorage = class {
  calcGrade(score, total, a = 90, b = 80, c = 70, d = 60) {
    const p = score / total * 100;
    if (p >= a) return "A";
    if (p >= b) return "B";
    if (p >= c) return "C";
    if (p >= d) return "D";
    return "F";
  }
  async getGradeThresholds() {
    const rows = await db.select().from(appSettings);
    const m = new Map(rows.map((r) => [r.key, r.value]));
    return {
      a: parseInt(m.get("grade_a_min") || "90"),
      b: parseInt(m.get("grade_b_min") || "80"),
      c: parseInt(m.get("grade_c_min") || "70"),
      d: parseInt(m.get("grade_d_min") || "60")
    };
  }
  async generateStudentCode() {
    const all = await db.select({ code: students.code }).from(students);
    const codes = new Set(all.map((s) => s.code));
    let code;
    do {
      code = Math.floor(100 + Math.random() * 900).toString();
    } while (codes.has(code));
    return code;
  }
  // ── Students ─────────────────────────────────────────────────────────────
  async getStudent(id) {
    const r = await db.select().from(students).where(eq(students.id, id));
    return r[0];
  }
  async getStudentByCode(code) {
    const r = await db.select().from(students).where(eq(students.code, code));
    return r[0];
  }
  async getAllStudents() {
    return db.select().from(students);
  }
  async createStudent(input) {
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
      qrPath: null
    }).returning();
    return r[0];
  }
  async updateStudent(id, u) {
    const r = await db.update(students).set(u).where(eq(students.id, id)).returning();
    if (!r[0]) throw new Error("Student not found");
    return r[0];
  }
  async deleteStudent(id) {
    const r = await db.delete(students).where(eq(students.id, id)).returning();
    return r.length > 0;
  }
  // ── Teachers ─────────────────────────────────────────────────────────────
  async getAllTeachers() {
    return db.select().from(teachers);
  }
  async getTeacher(id) {
    const r = await db.select().from(teachers).where(eq(teachers.id, id));
    return r[0];
  }
  async createTeacher(input) {
    const r = await db.insert(teachers).values({
      name: input.name,
      subject: input.subject,
      status: "active",
      phone: input.phone || null,
      email: input.email || null,
      salaryType: input.salaryType || "fixed",
      salaryAmount: input.salaryAmount ?? 0,
      notes: input.notes || null
    }).returning();
    return r[0];
  }
  async updateTeacher(id, u) {
    const r = await db.update(teachers).set(u).where(eq(teachers.id, id)).returning();
    if (!r[0]) throw new Error("Teacher not found");
    return r[0];
  }
  async deleteTeacher(id) {
    const r = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return r.length > 0;
  }
  // ── Subjects ─────────────────────────────────────────────────────────────
  async getAllSubjects() {
    return db.select().from(subjects);
  }
  async getSubject(id) {
    const r = await db.select().from(subjects).where(eq(subjects.id, id));
    return r[0];
  }
  async createSubject(input) {
    const r = await db.insert(subjects).values({
      name: input.name,
      description: input.description || null,
      teacherId: input.teacherId || null,
      price: input.price ?? 0,
      sessionsPerMonth: input.sessionsPerMonth ?? 4,
      color: input.color || "#6366f1"
    }).returning();
    return r[0];
  }
  async updateSubject(id, u) {
    const r = await db.update(subjects).set(u).where(eq(subjects.id, id)).returning();
    if (!r[0]) throw new Error("Subject not found");
    return r[0];
  }
  async deleteSubject(id) {
    const r = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return r.length > 0;
  }
  // ── Groups ────────────────────────────────────────────────────────────────
  async getAllGroups() {
    return db.select().from(groups);
  }
  async getGroup(id) {
    const r = await db.select().from(groups).where(eq(groups.id, id));
    return r[0];
  }
  async createGroup(input) {
    const r = await db.insert(groups).values({
      name: input.name,
      gradeLevel: input.gradeLevel,
      section: input.section,
      subject: input.subject || null,
      teacherId: input.teacherId || null,
      capacity: input.capacity ?? 30,
      description: input.description || null,
      color: input.color || "#6366f1"
    }).returning();
    return r[0];
  }
  async updateGroup(id, u) {
    const r = await db.update(groups).set(u).where(eq(groups.id, id)).returning();
    if (!r[0]) throw new Error("Group not found");
    return r[0];
  }
  async deleteGroup(id) {
    const r = await db.delete(groups).where(eq(groups.id, id)).returning();
    return r.length > 0;
  }
  // ── Enrollments ───────────────────────────────────────────────────────────
  async getAllEnrollments() {
    return db.select().from(enrollments);
  }
  async getEnrollmentsByStudent(studentId) {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }
  async getEnrollmentsByGroup(groupId) {
    return db.select().from(enrollments).where(eq(enrollments.groupId, groupId));
  }
  async getEnrollmentsByTeacher(teacherId) {
    return db.select().from(enrollments).where(eq(enrollments.teacherId, teacherId));
  }
  async createEnrollment(input) {
    const r = await db.insert(enrollments).values({
      studentId: input.studentId,
      status: input.status || "active",
      subjectId: input.subjectId || null,
      teacherId: input.teacherId || null,
      groupId: input.groupId || null,
      notes: input.notes || null
    }).returning();
    return r[0];
  }
  async updateEnrollment(id, u) {
    const r = await db.update(enrollments).set(u).where(eq(enrollments.id, id)).returning();
    if (!r[0]) throw new Error("Enrollment not found");
    return r[0];
  }
  async deleteEnrollment(id) {
    const r = await db.delete(enrollments).where(eq(enrollments.id, id)).returning();
    return r.length > 0;
  }
  // ── Subscriptions ─────────────────────────────────────────────────────────
  async getAllSubscriptions() {
    return db.select().from(subscriptions);
  }
  async getSubscriptionsByStudent(studentId) {
    return db.select().from(subscriptions).where(eq(subscriptions.studentId, studentId));
  }
  async createSubscription(input) {
    const r = await db.insert(subscriptions).values({
      studentId: input.studentId,
      amount: input.amount,
      startDate: input.startDate,
      status: input.status || "active",
      enrollmentId: input.enrollmentId || null,
      subjectId: input.subjectId || null,
      teacherId: input.teacherId || null,
      paid: input.paid ?? 0,
      endDate: input.endDate || null,
      notes: input.notes || null
    }).returning();
    return r[0];
  }
  async updateSubscription(id, u) {
    const r = await db.update(subscriptions).set(u).where(eq(subscriptions.id, id)).returning();
    if (!r[0]) throw new Error("Subscription not found");
    return r[0];
  }
  async deleteSubscription(id) {
    const r = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning();
    return r.length > 0;
  }
  // ── Sessions ──────────────────────────────────────────────────────────────
  async getSession(id) {
    const r = await db.select().from(sessions).where(eq(sessions.id, id));
    return r[0];
  }
  async getAllSessions() {
    return db.select().from(sessions);
  }
  async getActiveSession() {
    const r = await db.select().from(sessions).where(eq(sessions.status, "active"));
    return r[0];
  }
  async createSession(input) {
    const r = await db.insert(sessions).values({
      name: input.name,
      date: input.date,
      time: input.time,
      duration: input.duration,
      status: "scheduled",
      groupId: input.groupId || null,
      teacherId: input.teacherId || null,
      subjectId: input.subjectId || null
    }).returning();
    return r[0];
  }
  async updateSession(id, u) {
    const r = await db.update(sessions).set(u).where(eq(sessions.id, id)).returning();
    if (!r[0]) throw new Error("Session not found");
    return r[0];
  }
  // ── Attendance ────────────────────────────────────────────────────────────
  async getAllAttendance() {
    return db.select().from(attendance);
  }
  async getAttendanceBySession(sessionId) {
    return db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }
  async getAttendanceByStudent(studentId) {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }
  async getAttendanceRecord(studentId, sessionId) {
    const r = await db.select().from(attendance).where(
      and(eq(attendance.studentId, studentId), eq(attendance.sessionId, sessionId))
    );
    return r[0];
  }
  async createAttendance(input) {
    const r = await db.insert(attendance).values(input).returning();
    return r[0];
  }
  // ── Grades ────────────────────────────────────────────────────────────────
  async getGradesByStudent(studentId) {
    return db.select().from(grades).where(eq(grades.studentId, studentId));
  }
  async getAllGrades() {
    return db.select().from(grades);
  }
  async createGrade(input) {
    const t = await this.getGradeThresholds();
    const gradeVal = this.calcGrade(input.score, input.totalMarks, t.a, t.b, t.c, t.d);
    const r = await db.insert(grades).values({
      studentId: input.studentId,
      subject: input.subject,
      assessmentType: input.assessmentType,
      score: input.score,
      totalMarks: input.totalMarks,
      weight: input.weight ?? 1,
      notes: input.notes || null,
      grade: gradeVal,
      sentToParent: false
    }).returning();
    return r[0];
  }
  async updateGrade(id, u) {
    if (u.score !== void 0 || u.totalMarks !== void 0) {
      const existing = await db.select().from(grades).where(eq(grades.id, id));
      if (existing[0]) {
        const t = await this.getGradeThresholds();
        u.grade = this.calcGrade(u.score ?? existing[0].score, u.totalMarks ?? existing[0].totalMarks, t.a, t.b, t.c, t.d);
      }
    }
    const r = await db.update(grades).set(u).where(eq(grades.id, id)).returning();
    if (!r[0]) throw new Error("Grade not found");
    return r[0];
  }
  async deleteGrade(id) {
    const r = await db.delete(grades).where(eq(grades.id, id)).returning();
    return r.length > 0;
  }
  // ── Homework ──────────────────────────────────────────────────────────────
  async getAllHomework() {
    return db.select().from(homework);
  }
  async getHomework(id) {
    const r = await db.select().from(homework).where(eq(homework.id, id));
    return r[0];
  }
  async createHomework(input) {
    const r = await db.insert(homework).values({
      title: input.title,
      subject: input.subject,
      deadline: input.deadline,
      status: "active",
      description: input.description || null,
      groupId: input.groupId || null,
      totalMarks: input.totalMarks ?? 10
    }).returning();
    return r[0];
  }
  async updateHomework(id, u) {
    const r = await db.update(homework).set(u).where(eq(homework.id, id)).returning();
    if (!r[0]) throw new Error("Homework not found");
    return r[0];
  }
  async deleteHomework(id) {
    const r = await db.delete(homework).where(eq(homework.id, id)).returning();
    return r.length > 0;
  }
  async getSubmissionsByHomework(homeworkId) {
    return db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, homeworkId));
  }
  async getSubmissionsByStudent(studentId) {
    return db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.studentId, studentId));
  }
  async createSubmission(input) {
    const r = await db.insert(homeworkSubmissions).values({
      homeworkId: input.homeworkId,
      studentId: input.studentId,
      status: input.status || "pending",
      score: input.score ?? null,
      notes: input.notes || null
    }).returning();
    return r[0];
  }
  async updateSubmission(id, u) {
    const r = await db.update(homeworkSubmissions).set(u).where(eq(homeworkSubmissions.id, id)).returning();
    if (!r[0]) throw new Error("Submission not found");
    return r[0];
  }
  // ── Finances ──────────────────────────────────────────────────────────────
  async getAllFinances() {
    return db.select().from(finances);
  }
  async getFinancesByStudent(studentId) {
    return db.select().from(finances).where(eq(finances.studentId, studentId));
  }
  async createFinance(input) {
    const r = await db.insert(finances).values({
      studentId: input.studentId,
      type: input.type || "subscription",
      amount: input.amount,
      dueDate: input.dueDate,
      status: input.status || "pending",
      paid: input.paid ?? 0,
      notes: input.notes || null
    }).returning();
    return r[0];
  }
  async updateFinance(id, u) {
    const r = await db.update(finances).set(u).where(eq(finances.id, id)).returning();
    if (!r[0]) throw new Error("Finance not found");
    return r[0];
  }
  async deleteFinance(id) {
    const r = await db.delete(finances).where(eq(finances.id, id)).returning();
    return r.length > 0;
  }
  // ── Student Notes ─────────────────────────────────────────────────────────
  async getNotesByStudent(studentId) {
    return db.select().from(studentNotes).where(eq(studentNotes.studentId, studentId));
  }
  async createNote(input) {
    const r = await db.insert(studentNotes).values(input).returning();
    return r[0];
  }
  async deleteNote(id) {
    const r = await db.delete(studentNotes).where(eq(studentNotes.id, id)).returning();
    return r.length > 0;
  }
  // ── Exams ─────────────────────────────────────────────────────────────────
  async getAllExams() {
    return db.select().from(exams);
  }
  async getExam(id) {
    const r = await db.select().from(exams).where(eq(exams.id, id));
    return r[0];
  }
  async createExam(input) {
    const r = await db.insert(exams).values({
      title: input.title,
      subject: input.subject,
      date: input.date,
      status: "draft",
      groupId: input.groupId || null,
      duration: input.duration ?? 60,
      description: input.description || null
    }).returning();
    return r[0];
  }
  async updateExam(id, u) {
    const r = await db.update(exams).set(u).where(eq(exams.id, id)).returning();
    if (!r[0]) throw new Error("Exam not found");
    return r[0];
  }
  async deleteExam(id) {
    const r = await db.delete(exams).where(eq(exams.id, id)).returning();
    return r.length > 0;
  }
  async getExamQuestions(examId) {
    return db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
  }
  async createExamQuestion(input) {
    const r = await db.insert(examQuestions).values({
      examId: input.examId,
      question: input.question,
      type: input.type || "short",
      marks: input.marks ?? 5,
      options: input.options || null,
      correctAnswer: input.correctAnswer || null,
      orderIndex: input.orderIndex ?? 0
    }).returning();
    return r[0];
  }
  async deleteExamQuestion(id) {
    const r = await db.delete(examQuestions).where(eq(examQuestions.id, id)).returning();
    return r.length > 0;
  }
  async getExamSubmissions(examId) {
    return db.select().from(examSubmissions).where(eq(examSubmissions.examId, examId));
  }
  async createExamSubmission(input) {
    const r = await db.insert(examSubmissions).values({
      examId: input.examId,
      studentId: input.studentId,
      status: input.status || "pending",
      score: input.score ?? null,
      gradedAt: null
    }).returning();
    return r[0];
  }
  async updateExamSubmission(id, u) {
    const r = await db.update(examSubmissions).set(u).where(eq(examSubmissions.id, id)).returning();
    if (!r[0]) throw new Error("Submission not found");
    return r[0];
  }
  // ── Settings ──────────────────────────────────────────────────────────────
  defaultSettings = {
    app_name: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
    semester_start: "2025-09-01",
    semester_end: "2026-06-30",
    grade_a_min: "90",
    grade_b_min: "80",
    grade_c_min: "70",
    grade_d_min: "60",
    currency: "\u062C",
    primary_color: "#6366f1"
  };
  async getSetting(key) {
    const r = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return r[0]?.value ?? this.defaultSettings[key];
  }
  async setSetting(key, value) {
    await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } });
  }
  async getAllSettings() {
    const rows = await db.select().from(appSettings);
    const result = { ...this.defaultSettings };
    rows.forEach((r) => {
      result[r.key] = r.value;
    });
    return result;
  }
  // ── Automation Rules ──────────────────────────────────────────────────────
  async getAllAutomationRules() {
    return db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
  }
  async getAutomationRule(id) {
    const r = await db.select().from(automationRules).where(eq(automationRules.id, id));
    return r[0];
  }
  async createAutomationRule(input) {
    const r = await db.insert(automationRules).values({
      name: input.name,
      trigger: input.trigger,
      messageTemplate: input.messageTemplate,
      status: "active",
      runCount: 0,
      lastRun: null,
      description: input.description || null,
      triggerConfig: input.triggerConfig || null,
      targetGroup: input.targetGroup || null
    }).returning();
    return r[0];
  }
  async updateAutomationRule(id, u) {
    const r = await db.update(automationRules).set(u).where(eq(automationRules.id, id)).returning();
    if (!r[0]) throw new Error("Rule not found");
    return r[0];
  }
  async deleteAutomationRule(id) {
    const r = await db.delete(automationRules).where(eq(automationRules.id, id)).returning();
    return r.length > 0;
  }
  // ── Automation Logs ───────────────────────────────────────────────────────
  async getAllAutomationLogs() {
    return db.select().from(automationLogs).orderBy(desc(automationLogs.createdAt));
  }
  async getLogsByRule(ruleId) {
    return db.select().from(automationLogs).where(eq(automationLogs.ruleId, ruleId));
  }
  async createAutomationLog(input) {
    const r = await db.insert(automationLogs).values({
      ruleId: input.ruleId,
      status: input.status || "sent",
      ruleName: input.ruleName || null,
      studentId: input.studentId || null,
      phone: input.phone || null,
      message: input.message || null,
      reason: input.reason || null
    }).returning();
    return r[0];
  }
  async clearAutomationLogs() {
    await db.delete(automationLogs);
  }
  // ── Expenses ──────────────────────────────────────────────────────────────
  async getAllExpenses() {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }
  async getExpense(id) {
    const r = await db.select().from(expenses).where(eq(expenses.id, id));
    return r[0];
  }
  async createExpense(input) {
    const r = await db.insert(expenses).values({
      category: input.category,
      amount: input.amount,
      date: input.date,
      description: input.description || null
    }).returning();
    return r[0];
  }
  async updateExpense(id, u) {
    const r = await db.update(expenses).set(u).where(eq(expenses.id, id)).returning();
    if (!r[0]) throw new Error("Expense not found");
    return r[0];
  }
  async deleteExpense(id) {
    const r = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return r.length > 0;
  }
  // ── Users (Auth) ───────────────────────────────────────────────────────────
  async getAllUsers() {
    return db.select().from(users);
  }
  async getUserById(id) {
    const r = await db.select().from(users).where(eq(users.id, id));
    return r[0];
  }
  async getUserByEmail(email) {
    const r = await db.select().from(users).where(eq(users.email, email));
    return r[0];
  }
  async createUser(input) {
    const r = await db.insert(users).values(input).returning();
    return r[0];
  }
  async updateUser(id, u) {
    const r = await db.update(users).set(u).where(eq(users.id, id)).returning();
    if (!r[0]) throw new Error("User not found");
    return r[0];
  }
  async deleteUser(id) {
    const r = await db.delete(users).where(eq(users.id, id)).returning();
    return r.length > 0;
  }
  async countUsers() {
    const r = await db.select().from(users);
    return r.length;
  }
};

// server/storage.ts
var storage = new DatabaseStorage();

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
import multer from "multer";
import { createRequire as _createRequire } from "module";
import path2 from "path";
import fs2 from "fs";

// server/whatsapp-service.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import QRCode from "qrcode-terminal";
import P from "pino";
import fs from "fs";
import path from "path";
var logger = P({ level: "silent" });
var WhatsAppService = class {
  sock = null;
  isConnected = false;
  qrCode = null;
  connectionState = "disconnected";
  messagesFile = path.join(process.cwd(), "data", "whatsapp-messages.json");
  constructor() {
    this.ensureDataDirectory();
  }
  ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.messagesFile)) {
      fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
    }
  }
  saveMessage(message) {
    try {
      const messages = this.getStoredMessages();
      messages.push(message);
      fs.writeFileSync(this.messagesFile, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }
  getStoredMessages() {
    try {
      const data = fs.readFileSync(this.messagesFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading stored messages:", error);
      return [];
    }
  }
  updateMessageStatus(messageId, status) {
    try {
      const messages = this.getStoredMessages();
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex].status = status;
        fs.writeFileSync(this.messagesFile, JSON.stringify(messages, null, 2));
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  }
  async connect() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ["Student Grading System", "Desktop", "1.0.0"]
      });
      this.sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          this.qrCode = qr;
          console.log("QR Code updated");
          QRCode.generate(qr, { small: true });
        }
        if (connection === "close") {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
          this.isConnected = false;
          this.connectionState = "disconnected";
          if (shouldReconnect) {
            this.connect();
          }
        } else if (connection === "open") {
          console.log("WhatsApp connection opened successfully");
          this.isConnected = true;
          this.connectionState = "connected";
          this.qrCode = null;
          this.sendWelcomeMessage();
        }
        this.connectionState = connection || "disconnected";
      });
      this.sock.ev.on("creds.update", saveCreds);
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      this.connectionState = "error";
    }
  }
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      qrCode: this.qrCode
    };
  }
  async sendMessage(phoneNumber, message, studentName, grade) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedMessage = {
      id: messageId,
      to: phoneNumber,
      message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending",
      studentName,
      grade
    };
    this.saveMessage(storedMessage);
    if (!this.isConnected || !this.sock) {
      console.log("WhatsApp not connected, message saved for later");
      return messageId;
    }
    try {
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message });
      console.log(`Message sent to ${phoneNumber}: ${message}`);
      this.updateMessageStatus(messageId, "sent");
      return messageId;
    } catch (error) {
      console.error("Error sending message:", error);
      this.updateMessageStatus(messageId, "failed");
      throw error;
    }
  }
  async sendGradeMessage(studentName, phoneNumber, grade, subject = "\u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646", notes) {
    let message = `\u{1F4CA} \u0646\u062A\u064A\u062C\u0629 ${subject}

\u{1F464} \u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628: ${studentName}
\u{1F4DD} \u0627\u0644\u062F\u0631\u062C\u0629: ${grade}
\u{1F4C5} \u0627\u0644\u062A\u0627\u0631\u064A\u062E: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")}`;
    if (notes) {
      message += `

\u{1F4AC} \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0645:
${notes}`;
    }
    message += `

\u{1F4DE} \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629

\u{1F31F} \u0646\u062A\u0645\u0646\u0649 \u0644\u0644\u0637\u0627\u0644\u0628 \u062F\u0648\u0627\u0645 \u0627\u0644\u062A\u0641\u0648\u0642 \u0648\u0627\u0644\u0646\u062C\u0627\u062D`;
    return await this.sendMessage(phoneNumber, message, studentName, grade);
  }
  // Get available groups
  async getGroups() {
    if (!this.isConnected || !this.sock) {
      return [];
    }
    try {
      const chats = await this.sock.groupFetchAllParticipating();
      const groups2 = [];
      for (const [groupId, group] of Object.entries(chats)) {
        if (group && typeof group === "object" && "subject" in group && "participants" in group) {
          const groupData = group;
          groups2.push({
            id: groupId,
            name: groupData.subject || "Unknown Group",
            participantsCount: Array.isArray(groupData.participants) ? groupData.participants.length : 0,
            lastMessageTime: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      return groups2;
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  }
  // Send message to a group
  async sendGroupMessage(groupId, message, mentionAll = false, groupName) {
    const messageId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedMessage = {
      id: messageId,
      to: groupId,
      message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending",
      isGroupMessage: true,
      groupId,
      groupName
    };
    this.saveMessage(storedMessage);
    if (!this.isConnected || !this.sock) {
      console.log("WhatsApp not connected, group message saved for later");
      return messageId;
    }
    try {
      let messageContent = { text: message };
      if (mentionAll) {
        const groupMetadata = await this.sock.groupMetadata(groupId);
        const participants = groupMetadata.participants.map((p) => p.id);
        messageContent = {
          text: `@${participants.map(() => "").join(" @")}

${message}`,
          mentions: participants
        };
      }
      await this.sock.sendMessage(groupId, messageContent);
      console.log(`Group message sent to ${groupName || groupId}: ${message}`);
      this.updateMessageStatus(messageId, "sent");
      return messageId;
    } catch (error) {
      console.error("Error sending group message:", error);
      this.updateMessageStatus(messageId, "failed");
      throw error;
    }
  }
  // Send mention all message to group
  async mentionAllInGroup(groupId, message, groupName) {
    return await this.sendGroupMessage(groupId, message, true, groupName);
  }
  downloadMessagesAsJSON() {
    const messages = this.getStoredMessages();
    return Buffer.from(JSON.stringify(messages, null, 2));
  }
  downloadMessagesAsCSV() {
    const messages = this.getStoredMessages();
    const headers = ["ID", "Student Name", "Phone", "Grade", "Message", "Status", "Timestamp"];
    let csvContent = headers.join(",") + "\n";
    messages.forEach((msg) => {
      const row = [
        msg.id,
        msg.studentName || "",
        msg.to,
        msg.grade || "",
        `"${msg.message.replace(/"/g, '""')}"`,
        msg.status,
        msg.timestamp
      ];
      csvContent += row.join(",") + "\n";
    });
    return Buffer.from(csvContent);
  }
  async sendStoredMessage(messageId) {
    const messages = this.getStoredMessages();
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.status !== "pending") {
      return false;
    }
    if (!this.isConnected || !this.sock) {
      return false;
    }
    try {
      const cleanPhone = message.to.replace(/[^\d+]/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message.message });
      console.log(`Message sent to ${message.to}: ${message.message}`);
      this.updateMessageStatus(messageId, "sent");
      return true;
    } catch (error) {
      console.error("Error sending stored message:", error);
      this.updateMessageStatus(messageId, "failed");
      return false;
    }
  }
  async sendAllPendingMessages() {
    const messages = this.getStoredMessages();
    const pendingMessages = messages.filter((m) => m.status === "pending");
    let sent = 0;
    let failed = 0;
    if (!this.isConnected || !this.sock) {
      return { sent: 0, failed: pendingMessages.length, total: pendingMessages.length };
    }
    for (const message of pendingMessages) {
      try {
        const success = await this.sendStoredMessage(message.id);
        if (success) {
          sent++;
        } else {
          failed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      } catch (error) {
        failed++;
        console.error("Error sending message in batch:", error);
      }
    }
    return { sent, failed, total: pendingMessages.length };
  }
  async sendWelcomeMessage() {
    if (!this.isConnected || !this.sock) {
      return;
    }
    try {
      const me = this.sock.user;
      if (me?.id) {
        const welcomeMessage = `\u{1F389} \u0623\u0647\u0644\u0627\u064B \u0648\u0633\u0647\u0644\u0627\u064B! \u{1F389}

\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u062F\u0631\u062C\u0627\u062A!

\u{1F539} \u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u0648\u0627\u062A\u0633 \u0627\u0628 \u0628\u0646\u062C\u0627\u062D
\u{1F539} \u0633\u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0637\u0644\u0627\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B
\u{1F539} \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u062F\u0631\u062C\u0627\u062A

\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0646\u0638\u0627\u0645! \u{1F4DA}\u2728`;
        await this.sock.sendMessage(me.id, { text: welcomeMessage });
        console.log("Welcome message sent successfully");
      }
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  }
  clearMessages() {
    fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
  }
  disconnect() {
    if (this.sock) {
      this.sock.end();
      this.sock = null;
    }
    this.isConnected = false;
    this.connectionState = "disconnected";
    this.qrCode = null;
  }
};
var whatsappService = new WhatsAppService();

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "center-management-dev-secret-2025";
var JWT_EXPIRES = "7d";
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u2014 \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ message: "\u062C\u0644\u0633\u0629 \u0645\u0646\u062A\u0647\u064A\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u2014 \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645" });
      }
      next();
    });
  };
}
var isAdmin = requireRole("admin");
var isAdminOrAccountant = requireRole("admin", "accountant");
var isAdminOrTeacher = requireRole("admin", "teacher");
var isAdminOrReception = requireRole("admin", "reception");

// server/routes.ts
var _require = _createRequire(import.meta.url);
var archiver = _require("archiver");
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB limit
});
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV ?? "development",
      version: "1.0.0"
    });
  });
  app2.get("/api/stats", async (_req, res) => {
    try {
      const [students2, teachers2, sessions2, grades2, finances2, attendance2] = await Promise.all([
        storage.getAllStudents(),
        storage.getAllTeachers(),
        storage.getAllSessions(),
        storage.getAllGrades(),
        storage.getAllFinances(),
        storage.getAllAttendance()
      ]);
      const totalStudents = students2.length;
      const totalTeachers = teachers2.length;
      const completedSessions = sessions2.filter((s) => s.status === "completed").length;
      const activeSessions = sessions2.filter((s) => s.status === "active").length;
      const totalRevenue = finances2.filter((f) => f.status === "paid").reduce((sum, f) => sum + (f.paid ?? 0), 0);
      const pendingRevenue = finances2.filter((f) => f.status === "pending").reduce((sum, f) => sum + ((f.amount ?? 0) - (f.paid ?? 0)), 0);
      const ungradedCount = grades2.filter((g) => g.score === null || g.score === void 0).length;
      const attendanceRates = students2.map((s) => {
        const studentAttendance = attendance2.filter((a) => a.studentId === s.id);
        const present = studentAttendance.filter((a) => a.status === "present").length;
        return studentAttendance.length > 0 ? present / studentAttendance.length * 100 : 100;
      });
      const avgAttendanceRate = attendanceRates.length > 0 ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length : 0;
      const atRiskStudents = students2.filter((s) => {
        const sa = attendance2.filter((a) => a.studentId === s.id);
        if (sa.length < 3) return false;
        const rate = sa.filter((a) => a.status === "present").length / sa.length;
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
        atRiskStudents
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || user.status !== "active") {
        return res.status(401).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      }
      const valid = await comparePassword(password, user.password);
      if (!valid) return res.status(401).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      const payload = { userId: user.id, email: user.email, role: user.role, name: user.name, teacherId: user.teacherId };
      const token = signToken(payload);
      const { password: _, ...safeUser } = user;
      res.json({ token, user: { ...safeUser, role: user.role } });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D" });
  });
  app2.get("/api/users", requireRole("admin"), async (_req, res) => {
    try {
      const all = await storage.getAllUsers();
      res.json(all.map(({ password: _, ...u }) => u));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const hashed = await hashPassword(data.password);
      const user = await storage.createUser({ ...data, password: hashed });
      const { password: _, ...safe } = user;
      res.status(201).json(safe);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });
  app2.put("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const updates = req.body;
      if (updates.password) updates.password = await hashPassword(updates.password);
      const user = await storage.updateUser(req.params.id, updates);
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const ok = await storage.deleteUser(req.params.id);
      if (!ok) return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/seed", async (_req, res) => {
    try {
      const userCount = await storage.countUsers();
      if (userCount > 0) return res.json({ message: "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0645\u0648\u062C\u0648\u062F\u0629 \u0628\u0627\u0644\u0641\u0639\u0644", skipped: true });
      const adminPass = await hashPassword("admin123");
      const recPass = await hashPassword("rec123");
      const teachPass = await hashPassword("teach123");
      const accPass = await hashPassword("acc123");
      await storage.createUser({ name: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", email: "admin@school.edu", password: adminPass, role: "admin" });
      await storage.createUser({ name: "\u0645\u0648\u0638\u0641 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644", email: "reception@school.edu", password: recPass, role: "reception" });
      await storage.createUser({ name: "\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0646\u0638\u0627\u0645", email: "accountant@school.edu", password: accPass, role: "accountant" });
      const teacher = await storage.createTeacher({
        name: "\u0623\u0633\u062A\u0627\u0630 \u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F",
        subject: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A",
        phone: "01012345678",
        email: "teacher@school.edu",
        salaryType: "fixed",
        salaryAmount: 5e3
      });
      await storage.createUser({ name: "\u0623\u0633\u062A\u0627\u0630 \u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F", email: "teacher@school.edu", password: teachPass, role: "teacher", teacherId: teacher.id });
      await storage.createSubject({ name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A", teacherId: teacher.id, price: 300, sessionsPerMonth: 8, color: "#6366f1" });
      await storage.createSubject({ name: "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621", teacherId: teacher.id, price: 300, sessionsPerMonth: 8, color: "#0ea5e9" });
      const group = await storage.createGroup({
        name: "\u0645\u062C\u0645\u0648\u0639\u0629 \u0623\u0648\u0644\u0649 \u062B\u0627\u0646\u0648\u064A \u0623",
        gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A",
        section: "\u0623",
        subject: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A",
        teacherId: teacher.id,
        capacity: 20,
        color: "#6366f1"
      });
      const studentData = [
        { name: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u0648\u062F \u0639\u0644\u064A", guardianPhone: "01099887766", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0623" },
        { name: "\u0633\u0627\u0631\u0629 \u062E\u0627\u0644\u062F \u062D\u0633\u0646", guardianPhone: "01088776655", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0623" },
        { name: "\u0639\u0645\u0631 \u064A\u0648\u0633\u0641 \u0625\u0628\u0631\u0627\u0647\u064A\u0645", guardianPhone: "01077665544", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0628" },
        { name: "\u0645\u0646\u0649 \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0645\u062D\u0645\u062F", guardianPhone: "01066554433", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0623" },
        { name: "\u0643\u0631\u064A\u0645 \u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u0633\u0627\u0644\u0645", guardianPhone: "01055443322", gradeLevel: "\u062B\u0627\u0646\u064A \u062B\u0627\u0646\u0648\u064A", section: "\u0623" },
        { name: "\u0646\u0648\u0631 \u0627\u0644\u062F\u064A\u0646 \u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646", guardianPhone: "01044332211", gradeLevel: "\u062B\u0627\u0646\u064A \u062B\u0627\u0646\u0648\u064A", section: "\u0628" },
        { name: "\u064A\u0627\u0633\u0645\u064A\u0646 \u0637\u0627\u0631\u0642 \u0641\u0647\u0645\u064A", guardianPhone: "01033221100", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0623" },
        { name: "\u0645\u062D\u0645\u062F \u0639\u0644\u064A \u062D\u0633\u064A\u0646", guardianPhone: "01122334455", gradeLevel: "\u0623\u0648\u0644 \u062B\u0627\u0646\u0648\u064A", section: "\u0628" }
      ];
      const createdStudents = [];
      for (const s of studentData) {
        const student = await storage.createStudent({ ...s, address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629" });
        createdStudents.push(student);
      }
      for (const s of createdStudents.slice(0, 6)) {
        await storage.createEnrollment({ studentId: s.id, teacherId: teacher.id, groupId: group.id, status: "active" });
      }
      const today = /* @__PURE__ */ new Date();
      const fmt = (d) => d.toISOString().split("T")[0];
      const session1 = await storage.createSession({
        name: "\u062D\u0635\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A - \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0623",
        date: fmt(today),
        time: "10:00",
        duration: 90,
        groupId: group.id,
        teacherId: teacher.id
      });
      await storage.updateSession(session1.id, { status: "completed" });
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const session2 = await storage.createSession({
        name: "\u062D\u0635\u0629 \u0645\u0631\u0627\u062C\u0639\u0629 \u0634\u0627\u0645\u0644\u0629",
        date: fmt(yesterday),
        time: "14:00",
        duration: 60,
        groupId: group.id,
        teacherId: teacher.id
      });
      await storage.updateSession(session2.id, { status: "completed" });
      for (const s of createdStudents.slice(0, 5)) {
        await storage.createAttendance({ studentId: s.id, sessionId: session1.id, status: "present", scanMethod: "manual" });
      }
      await storage.createAttendance({ studentId: createdStudents[5].id, sessionId: session1.id, status: "absent", scanMethod: "manual" });
      const subjects2 = ["\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A", "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621", "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621"];
      const types = ["\u0627\u0645\u062A\u062D\u0627\u0646 \u0634\u0647\u0631\u064A", "\u0648\u0627\u062C\u0628 \u0645\u0646\u0632\u0644\u064A", "\u0645\u0634\u0627\u0631\u0643\u0629 \u0635\u0641\u064A\u0629"];
      for (const s of createdStudents) {
        for (let i = 0; i < 2; i++) {
          const score = 60 + Math.floor(Math.random() * 40);
          await storage.createGrade({
            studentId: s.id,
            subject: subjects2[i % subjects2.length],
            assessmentType: types[i % types.length],
            score,
            totalMarks: 100,
            weight: 1
          });
        }
      }
      for (const s of createdStudents) {
        const paid = Math.random() > 0.3 ? 300 : 0;
        await storage.createFinance({
          studentId: s.id,
          type: "subscription",
          amount: 300,
          paid,
          dueDate: fmt(today),
          status: paid > 0 ? "paid" : "pending"
        });
      }
      res.json({ message: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0628\u0646\u062C\u0627\u062D", counts: {
        users: 4,
        teachers: 1,
        students: studentData.length,
        sessions: 2,
        groups: 1,
        attendance: 6,
        grades: createdStudents.length * 2
      } });
    } catch (e) {
      console.error("Seed error:", e);
      res.status(500).json({ message: `\u0641\u0634\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${e.message}` });
    }
  });
  app2.get("/api/students", async (req, res) => {
    try {
      const students2 = await storage.getAllStudents();
      res.json(students2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.get("/api/students/:id", async (req, res) => {
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
  app2.get("/api/students/code/:code", async (req, res) => {
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
  app2.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });
  app2.post("/api/students/bulk-import", upload.single("csvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }
      const csvContent = req.file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must have header and at least one data row" });
      }
      const header = lines[0].split(",").map((h) => h.trim());
      const results = {
        success: [],
        errors: []
      };
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        try {
          const studentData = {};
          header.forEach((col, index) => {
            const value = values[index] || "";
            switch (col.toLowerCase()) {
              case "name":
              case "student name":
              case "\u0627\u0644\u0627\u0633\u0645":
                studentData.name = value;
                break;
              case "guardian phone":
              case "guardianphone":
              case "phone":
              case "\u0631\u0642\u0645 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631":
                studentData.guardianPhone = value;
                break;
              case "guardian phone 2":
              case "guardianphone2":
              case "phone2":
              case "\u0631\u0642\u0645 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631 2":
                studentData.guardianPhone2 = value || null;
                break;
              case "address":
              case "\u0627\u0644\u0639\u0646\u0648\u0627\u0646":
                studentData.address = value || null;
                break;
              case "grade":
              case "grade level":
              case "gradelevel":
              case "\u0627\u0644\u0635\u0641":
                studentData.gradeLevel = value;
                break;
              case "section":
              case "class":
              case "\u0627\u0644\u0634\u0639\u0628\u0629":
                studentData.section = value;
                break;
            }
          });
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
        } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to process CSV file", error: error.message });
    }
  });
  app2.put("/api/students/:id", async (req, res) => {
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
  app2.delete("/api/students/:id", async (req, res) => {
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
  app2.get("/api/sessions", async (req, res) => {
    try {
      const sessions2 = await storage.getAllSessions();
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  app2.get("/api/sessions/active", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      res.json(activeSession || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });
  app2.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });
  app2.put("/api/sessions/:id", async (req, res) => {
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
  app2.get("/api/attendance/session/:sessionId", async (req, res) => {
    try {
      const attendance2 = await storage.getAttendanceBySession(req.params.sessionId);
      res.json(attendance2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });
  app2.get("/api/attendance/student/:studentId", async (req, res) => {
    try {
      const attendance2 = await storage.getAttendanceByStudent(req.params.studentId);
      res.json(attendance2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });
  app2.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const existingAttendance = await storage.getAttendanceRecord(
        attendanceData.studentId,
        attendanceData.sessionId
      );
      if (existingAttendance) {
        return res.status(409).json({ message: "Attendance already recorded for this student in this session" });
      }
      const attendance2 = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });
  app2.get("/api/grades", async (req, res) => {
    try {
      const grades2 = await storage.getAllGrades();
      res.json(grades2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });
  app2.get("/api/grades/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const grades2 = await storage.getGradesByStudent(studentId);
      res.json(grades2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student grades" });
    }
  });
  app2.post("/api/grades", async (req, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid grade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grade" });
    }
  });
  app2.put("/api/grades/:id", async (req, res) => {
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
  app2.delete("/api/grades/:id", async (req, res) => {
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
  app2.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = whatsappService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get WhatsApp status" });
    }
  });
  app2.post("/api/whatsapp/connect", async (req, res) => {
    try {
      await whatsappService.connect();
      res.json({ message: "WhatsApp connection initiated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect to WhatsApp" });
    }
  });
  app2.post("/api/whatsapp/disconnect", async (req, res) => {
    try {
      whatsappService.disconnect();
      res.json({ message: "WhatsApp disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
    }
  });
  app2.post("/api/whatsapp/send-grade", async (req, res) => {
    try {
      const { studentName, phoneNumber, grade, subject, notes } = req.body;
      if (!studentName || !phoneNumber || !grade) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const messageId = await whatsappService.sendGradeMessage(
        studentName,
        phoneNumber,
        grade,
        subject || "\u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646",
        notes
      );
      res.json({ messageId, message: "Grade message queued successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send grade message" });
    }
  });
  app2.get("/api/whatsapp/messages", async (req, res) => {
    try {
      const messages = whatsappService.getStoredMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  app2.get("/api/whatsapp/messages/export", async (req, res) => {
    try {
      const format = req.query.format || "json";
      if (format === "csv") {
        const csvData = whatsappService.downloadMessagesAsCSV();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=whatsapp-messages.csv");
        res.send(csvData);
      } else {
        const jsonData = whatsappService.downloadMessagesAsJSON();
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", "attachment; filename=whatsapp-messages.json");
        res.send(jsonData);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export messages" });
    }
  });
  app2.delete("/api/whatsapp/messages", async (req, res) => {
    try {
      whatsappService.clearMessages();
      res.json({ message: "Messages cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });
  app2.post("/api/whatsapp/send-message/:messageId", async (req, res) => {
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
  app2.post("/api/whatsapp/send-all", async (req, res) => {
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
  app2.get("/api/whatsapp/groups", async (req, res) => {
    try {
      const groups2 = await whatsappService.getGroups();
      res.json(groups2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get groups" });
    }
  });
  app2.post("/api/whatsapp/send-group-message", async (req, res) => {
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
  app2.post("/api/whatsapp/mention-all", async (req, res) => {
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
  const sendBulkGradesHandler = async (req, res) => {
    try {
      const { gradeIds } = req.body;
      if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
        return res.status(400).json({ message: "Grade IDs array is required" });
      }
      const students2 = await storage.getAllStudents();
      const grades2 = await storage.getAllGrades();
      let sent = 0;
      let total = gradeIds.length;
      for (const gradeId of gradeIds) {
        const grade = grades2.find((g) => g.id === gradeId);
        if (!grade) continue;
        const student = students2.find((s) => s.id === grade.studentId);
        if (!student || !student.guardianPhone) continue;
        try {
          await whatsappService.sendGradeMessage(
            student.name,
            student.guardianPhone,
            `${grade.score}/${grade.totalMarks} (${grade.grade})`,
            grade.subject,
            grade.notes || void 0
          );
          await storage.updateGrade(gradeId, { sentToParent: true });
          sent++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to send grade message for ${student.name}:`, error);
        }
      }
      res.json({ sent, total, message: `Successfully sent ${sent} of ${total} messages` });
    } catch (error) {
      res.status(500).json({ message: "Failed to send bulk grade messages" });
    }
  };
  app2.post("/api/whatsapp/send-grade-notification", sendBulkGradesHandler);
  app2.post("/api/whatsapp/send-bulk-grades", sendBulkGradesHandler);
  app2.get("/api/groups", async (_req, res) => {
    try {
      res.json(await storage.getAllGroups());
    } catch {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });
  app2.get("/api/groups/:id", async (req, res) => {
    try {
      const g = await storage.getGroup(req.params.id);
      if (!g) return res.status(404).json({ message: "Group not found" });
      res.json(g);
    } catch {
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });
  app2.post("/api/groups", async (req, res) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      res.status(201).json(await storage.createGroup(data));
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create group" });
    }
  });
  app2.put("/api/groups/:id", async (req, res) => {
    try {
      res.json(await storage.updateGroup(req.params.id, req.body));
    } catch (e) {
      res.status(e.message?.includes("not found") ? 404 : 500).json({ message: e.message });
    }
  });
  app2.delete("/api/groups/:id", async (req, res) => {
    try {
      const ok = await storage.deleteGroup(req.params.id);
      if (!ok) return res.status(404).json({ message: "Group not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete group" });
    }
  });
  app2.get("/api/homework", async (_req, res) => {
    try {
      res.json(await storage.getAllHomework());
    } catch {
      res.status(500).json({ message: "Failed to fetch homework" });
    }
  });
  app2.post("/api/homework", async (req, res) => {
    try {
      const data = insertHomeworkSchema.parse(req.body);
      res.status(201).json(await storage.createHomework(data));
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create homework" });
    }
  });
  app2.put("/api/homework/:id", async (req, res) => {
    try {
      res.json(await storage.updateHomework(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/homework/:id", async (req, res) => {
    try {
      const ok = await storage.deleteHomework(req.params.id);
      if (!ok) return res.status(404).json({ message: "Homework not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete homework" });
    }
  });
  app2.get("/api/homework/submissions", async (_req, res) => {
    try {
      const allHw = await storage.getAllHomework();
      const allSubs = [];
      for (const hw of allHw) {
        const subs = await storage.getSubmissionsByHomework(hw.id);
        allSubs.push(...subs);
      }
      res.json(allSubs);
    } catch {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.post("/api/homework/submissions", async (req, res) => {
    try {
      const data = insertHomeworkSubmissionSchema.parse(req.body);
      res.status(201).json(await storage.createSubmission(data));
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create submission" });
    }
  });
  app2.put("/api/homework/submissions/:id", async (req, res) => {
    try {
      res.json(await storage.updateSubmission(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/finances", async (_req, res) => {
    try {
      res.json(await storage.getAllFinances());
    } catch {
      res.status(500).json({ message: "Failed to fetch finances" });
    }
  });
  app2.get("/api/finances/student/:studentId", async (req, res) => {
    try {
      res.json(await storage.getFinancesByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch finances" });
    }
  });
  app2.post("/api/finances", async (req, res) => {
    try {
      const data = insertFinanceSchema.parse(req.body);
      res.status(201).json(await storage.createFinance(data));
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });
  app2.put("/api/finances/:id", async (req, res) => {
    try {
      res.json(await storage.updateFinance(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/finances/:id", async (req, res) => {
    try {
      const ok = await storage.deleteFinance(req.params.id);
      if (!ok) return res.status(404).json({ message: "Finance record not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete finance record" });
    }
  });
  app2.get("/api/homework/submissions/student/:studentId", async (req, res) => {
    try {
      res.json(await storage.getSubmissionsByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch student submissions" });
    }
  });
  app2.get("/api/homework/:homeworkId/submissions", async (req, res) => {
    try {
      res.json(await storage.getSubmissionsByHomework(req.params.homeworkId));
    } catch {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.get("/api/grades/student/:studentId", async (req, res) => {
    try {
      res.json(await storage.getGradesByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });
  app2.get("/api/student-notes/:studentId", async (req, res) => {
    try {
      res.json(await storage.getNotesByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app2.post("/api/student-notes", async (req, res) => {
    try {
      const { studentId, content, type } = req.body;
      if (!studentId || !content) return res.status(400).json({ message: "studentId and content required" });
      res.status(201).json(await storage.createNote({ studentId, content, type: type || "general" }));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/student-notes/:id", async (req, res) => {
    try {
      const ok = await storage.deleteNote(req.params.id);
      if (!ok) return res.status(404).json({ message: "Note not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });
  app2.get("/api/exams", async (_req, res) => {
    try {
      res.json(await storage.getAllExams());
    } catch {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });
  app2.get("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      res.json(exam);
    } catch {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });
  app2.post("/api/exams", async (req, res) => {
    try {
      const { title, subject, groupId, date, duration, description } = req.body;
      if (!title || !subject || !date) return res.status(400).json({ message: "title, subject, date required" });
      res.status(201).json(await storage.createExam({ title, subject, groupId: groupId === "all" ? null : groupId || null, date, duration: duration || 60, description: description || null }));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/exams/:id", async (req, res) => {
    try {
      res.json(await storage.updateExam(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/exams/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExam(req.params.id);
      if (!ok) return res.status(404).json({ message: "Exam not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });
  app2.get("/api/exams/:examId/questions", async (req, res) => {
    try {
      res.json(await storage.getExamQuestions(req.params.examId));
    } catch {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });
  app2.post("/api/exams/:examId/questions", async (req, res) => {
    try {
      const { question, type, options, correctAnswer, marks, orderIndex } = req.body;
      if (!question) return res.status(400).json({ message: "question required" });
      res.status(201).json(await storage.createExamQuestion({ examId: req.params.examId, question, type: type || "short", options: options || null, correctAnswer: correctAnswer || null, marks: marks || 5, orderIndex: orderIndex || 0 }));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/exam-questions/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExamQuestion(req.params.id);
      if (!ok) return res.status(404).json({ message: "Question not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });
  app2.get("/api/exams/:examId/submissions", async (req, res) => {
    try {
      res.json(await storage.getExamSubmissions(req.params.examId));
    } catch {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.post("/api/exam-submissions", async (req, res) => {
    try {
      const { examId, studentId, score, status } = req.body;
      if (!examId || !studentId) return res.status(400).json({ message: "examId and studentId required" });
      res.status(201).json(await storage.createExamSubmission({ examId, studentId, score: score ?? null, status: status || "pending" }));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/exam-submissions/:id", async (req, res) => {
    try {
      res.json(await storage.updateExamSubmission(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/settings", async (_req, res) => {
    try {
      res.json(await storage.getAllSettings());
    } catch {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.get("/api/settings/:key", async (req, res) => {
    try {
      const value = await storage.getSetting(req.params.key);
      if (value === void 0) return res.status(404).json({ message: "Setting not found" });
      res.json({ key: req.params.key, value });
    } catch {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  app2.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      if (value === void 0) return res.status(400).json({ message: "value required" });
      await storage.setSetting(req.params.key, String(value));
      res.json({ key: req.params.key, value: String(value) });
    } catch {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  app2.get("/api/automation-rules", async (_req, res) => {
    try {
      res.json(await storage.getAllAutomationRules());
    } catch {
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });
  app2.get("/api/automation-rules/:id", async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) return res.status(404).json({ message: "Rule not found" });
      res.json(rule);
    } catch {
      res.status(500).json({ message: "Failed to fetch rule" });
    }
  });
  app2.post("/api/automation-rules", async (req, res) => {
    try {
      const { name, description, trigger, triggerConfig, messageTemplate, targetGroup } = req.body;
      if (!name || !trigger || !messageTemplate) return res.status(400).json({ message: "name, trigger, messageTemplate required" });
      res.status(201).json(await storage.createAutomationRule({ name, description: description || null, trigger, triggerConfig: triggerConfig || null, messageTemplate, targetGroup: targetGroup || null }));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/automation-rules/:id", async (req, res) => {
    try {
      res.json(await storage.updateAutomationRule(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/automation-rules/:id", async (req, res) => {
    try {
      const ok = await storage.deleteAutomationRule(req.params.id);
      if (!ok) return res.status(404).json({ message: "Rule not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });
  app2.post("/api/automation-rules/:id/run", async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) return res.status(404).json({ message: "Rule not found" });
      if (rule.status !== "active") return res.status(400).json({ message: "Rule is paused" });
      const students2 = await storage.getAllStudents();
      const appName = await storage.getSetting("app_name") || "\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629";
      let sent = 0;
      let skipped = 0;
      const logs = [];
      const applyTemplate = (template, vars) => {
        return template.replace(/\{\{اسم_الطالب\}\}/g, vars.studentName || "").replace(/\{\{المادة\}\}/g, vars.subject || "").replace(/\{\{الدرجة\}\}/g, vars.grade || "").replace(/\{\{التاريخ\}\}/g, vars.date || (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA")).replace(/\{\{اسم_المدرسة\}\}/g, appName).replace(/\{\{الحصة\}\}/g, vars.session || "").replace(/\{\{الواجب\}\}/g, vars.homework || "");
      };
      const targetStudents = rule.targetGroup ? students2.filter((s) => s.groupId === rule.targetGroup) : students2;
      if (rule.trigger === "grade_added" || rule.trigger === "low_grade") {
        const allGrades = await storage.getAllGrades();
        let grades2 = allGrades.filter((g) => !g.sentToParent);
        if (rule.trigger === "low_grade" && rule.triggerConfig) {
          try {
            const cfg = JSON.parse(rule.triggerConfig);
            const threshold = cfg.threshold || 60;
            grades2 = grades2.filter((g) => g.score / g.totalMarks * 100 < threshold);
          } catch {
          }
        }
        for (const grade of grades2) {
          const student = targetStudents.find((s) => s.id === grade.studentId);
          if (!student || !student.guardianPhone) {
            skipped++;
            continue;
          }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, subject: grade.subject, grade: `${grade.score}/${grade.totalMarks} (${grade.grade})`, date: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      } else if (rule.trigger === "attendance_absent") {
        const activeSession = await storage.getActiveSession();
        if (activeSession) {
          const sessionAttendance = await storage.getAttendanceBySession(activeSession.id);
          const absentStudents = targetStudents.filter((s) => !sessionAttendance.some((a) => a.studentId === s.id));
          for (const student of absentStudents) {
            if (!student.guardianPhone) {
              skipped++;
              continue;
            }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, session: activeSession.name, date: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA") });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        } else {
          skipped = targetStudents.length;
        }
      } else if (rule.trigger === "payment_overdue") {
        const allFinances = await storage.getAllFinances();
        const overdueFinances = allFinances.filter((f) => f.status === "overdue" || f.status === "partial" && new Date(f.dueDate) < /* @__PURE__ */ new Date());
        for (const finance of overdueFinances) {
          const student = targetStudents.find((s) => s.id === finance.studentId);
          if (!student || !student.guardianPhone) {
            skipped++;
            continue;
          }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, date: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      } else if (rule.trigger === "homework_due") {
        const allHomework = await storage.getAllHomework();
        const tomorrow = /* @__PURE__ */ new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const dueHw = allHomework.filter((h) => h.deadline === tomorrowStr && h.status === "active");
        for (const hw of dueHw) {
          const hwStudents = hw.groupId ? targetStudents.filter((s) => s.groupId === hw.groupId) : targetStudents;
          for (const student of hwStudents) {
            if (!student.guardianPhone) {
              skipped++;
              continue;
            }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, homework: hw.title, date: tomorrowStr });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        }
      } else if (rule.trigger === "session_start") {
        const activeSession = await storage.getActiveSession();
        if (activeSession) {
          for (const student of targetStudents) {
            if (!student.guardianPhone) {
              skipped++;
              continue;
            }
            const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, session: activeSession.name, date: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA") });
            await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
            sent++;
          }
        } else {
          skipped = targetStudents.length;
        }
      } else if (rule.trigger === "manual") {
        for (const student of targetStudents) {
          if (!student.guardianPhone) {
            skipped++;
            continue;
          }
          const msg = applyTemplate(rule.messageTemplate, { studentName: student.name, date: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-SA") });
          await storage.createAutomationLog({ ruleId: rule.id, ruleName: rule.name, studentId: student.id, phone: student.guardianPhone, message: msg, status: "sent", reason: null });
          sent++;
        }
      }
      await storage.updateAutomationRule(rule.id, { runCount: (rule.runCount || 0) + 1, lastRun: /* @__PURE__ */ new Date() });
      res.json({ sent, skipped, total: sent + skipped });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/automation-logs", async (_req, res) => {
    try {
      res.json(await storage.getAllAutomationLogs());
    } catch {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  app2.get("/api/automation-logs/rule/:ruleId", async (req, res) => {
    try {
      res.json(await storage.getLogsByRule(req.params.ruleId));
    } catch {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  app2.delete("/api/automation-logs", async (_req, res) => {
    try {
      await storage.clearAutomationLogs();
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });
  app2.get("/api/download/backend", (_req, res) => {
    try {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=student-system-backend.zip");
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (err) => {
        res.status(500).send({ error: err.message });
      });
      archive.pipe(res);
      const rootDir = path2.resolve(process.cwd());
      archive.directory(path2.join(rootDir, "server"), "server");
      archive.directory(path2.join(rootDir, "shared"), "shared");
      for (const f of ["package.json", "tsconfig.json", "drizzle.config.ts"]) {
        const fp = path2.join(rootDir, f);
        if (fs2.existsSync(fp)) archive.file(fp, { name: f });
      }
      archive.append(
        `# Student System - Backend

## Setup

\`\`\`bash
npm install
npm run dev
\`\`\`

## Environment Variables

- \`DATABASE_URL\` \u2014 PostgreSQL connection string
- \`PORT\` \u2014 Server port (default: 5000)

## Deploy to Railway / Render

1. Push this folder to GitHub
2. Connect to Railway or Render
3. Set DATABASE_URL env var
4. Deploy!
`,
        { name: "README.md" }
      );
      archive.finalize();
    } catch (err) {
      res.status(500).json({ message: "Failed to create ZIP", error: err.message });
    }
  });
  app2.get("/api/teachers", async (_req, res) => {
    try {
      res.json(await storage.getAllTeachers());
    } catch {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });
  app2.get("/api/teachers/:id", async (req, res) => {
    try {
      const t = await storage.getTeacher(req.params.id);
      if (!t) return res.status(404).json({ message: "Teacher not found" });
      res.json(t);
    } catch {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });
  app2.post("/api/teachers", async (req, res) => {
    try {
      const data = insertTeacherSchema.parse(req.body);
      res.status(201).json(await storage.createTeacher(data));
    } catch (e) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/teachers/:id", async (req, res) => {
    try {
      res.json(await storage.updateTeacher(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/teachers/:id", async (req, res) => {
    try {
      const ok = await storage.deleteTeacher(req.params.id);
      if (!ok) return res.status(404).json({ message: "Teacher not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });
  app2.get("/api/subjects", async (_req, res) => {
    try {
      res.json(await storage.getAllSubjects());
    } catch {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });
  app2.post("/api/subjects", async (req, res) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      res.status(201).json(await storage.createSubject(data));
    } catch (e) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/subjects/:id", async (req, res) => {
    try {
      res.json(await storage.updateSubject(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/subjects/:id", async (req, res) => {
    try {
      const ok = await storage.deleteSubject(req.params.id);
      if (!ok) return res.status(404).json({ message: "Subject not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });
  app2.get("/api/enrollments", async (_req, res) => {
    try {
      res.json(await storage.getAllEnrollments());
    } catch {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.get("/api/enrollments/student/:studentId", async (req, res) => {
    try {
      res.json(await storage.getEnrollmentsByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.get("/api/enrollments/teacher/:teacherId", async (req, res) => {
    try {
      res.json(await storage.getEnrollmentsByTeacher(req.params.teacherId));
    } catch {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.post("/api/enrollments", async (req, res) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      res.status(201).json(await storage.createEnrollment(data));
    } catch (e) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/enrollments/:id", async (req, res) => {
    try {
      res.json(await storage.updateEnrollment(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/enrollments/:id", async (req, res) => {
    try {
      const ok = await storage.deleteEnrollment(req.params.id);
      if (!ok) return res.status(404).json({ message: "Enrollment not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });
  app2.get("/api/subscriptions", async (_req, res) => {
    try {
      res.json(await storage.getAllSubscriptions());
    } catch {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/subscriptions/student/:studentId", async (req, res) => {
    try {
      res.json(await storage.getSubscriptionsByStudent(req.params.studentId));
    } catch {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  app2.post("/api/subscriptions", async (req, res) => {
    try {
      const data = insertSubscriptionSchema.parse(req.body);
      res.status(201).json(await storage.createSubscription(data));
    } catch (e) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/subscriptions/:id", async (req, res) => {
    try {
      res.json(await storage.updateSubscription(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const ok = await storage.deleteSubscription(req.params.id);
      if (!ok) return res.status(404).json({ message: "Subscription not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });
  app2.get("/api/expenses", async (_req, res) => {
    try {
      res.json(await storage.getAllExpenses());
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/expenses", async (req, res) => {
    try {
      const { insertExpenseSchema: insertExpenseSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertExpenseSchema2.parse(req.body);
      res.status(201).json(await storage.createExpense(data));
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });
  app2.put("/api/expenses/:id", async (req, res) => {
    try {
      res.json(await storage.updateExpense(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/expenses/:id", async (req, res) => {
    try {
      const ok = await storage.deleteExpense(req.params.id);
      if (!ok) return res.status(404).json({ message: "Expense not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });
  app2.get("/api/teachers/:id/salary-report", async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) return res.status(404).json({ message: "Teacher not found" });
      const enrollments2 = await storage.getAllEnrollments();
      const finances2 = await storage.getAllFinances();
      const activeStudents = enrollments2.filter((e) => e.teacherId === teacher.id && e.status === "active");
      const studentCount = activeStudents.length;
      const studentIds = activeStudents.map((e) => e.studentId);
      const teacherRevenue = finances2.filter((f) => studentIds.includes(f.studentId) && f.status === "paid").reduce((s, f) => s + (f.paid ?? 0), 0);
      let expectedSalary = 0;
      if (teacher.salaryType === "fixed") expectedSalary = teacher.salaryAmount || 0;
      else if (teacher.salaryType === "per_student") expectedSalary = (teacher.salaryAmount || 0) * studentCount;
      else if (teacher.salaryType === "percentage") expectedSalary = teacherRevenue * ((teacher.salaryAmount || 0) / 100);
      res.json({ teacher, studentCount, teacherRevenue, expectedSalary, paid: 0, remaining: expectedSalary });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/export/backend", async (_req, res) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="center-m-backend.zip"');
      archive.pipe(res);
      const root = process.cwd();
      const backendDir = path2.join(root, "backend");
      if (fs2.existsSync(backendDir)) {
        for (const file of fs2.readdirSync(backendDir)) {
          const filePath = path2.join(backendDir, file);
          if (fs2.statSync(filePath).isFile()) {
            archive.file(filePath, { name: file });
          }
        }
      }
      await archive.finalize();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  (async () => {
    try {
      const userCount = await storage.countUsers();
      if (userCount === 0) {
        const adminPass = await hashPassword("admin123");
        const recPass = await hashPassword("rec123");
        const teachPass = await hashPassword("teach123");
        const accPass = await hashPassword("acc123");
        await storage.createUser({ name: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", email: "admin@school.edu", password: adminPass, role: "admin" });
        await storage.createUser({ name: "\u0645\u0648\u0638\u0641 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644", email: "reception@school.edu", password: recPass, role: "reception" });
        await storage.createUser({ name: "\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0646\u0638\u0627\u0645", email: "accountant@school.edu", password: accPass, role: "accountant" });
        const teacher = await storage.createTeacher({
          name: "\u0623\u0633\u062A\u0627\u0630 \u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F",
          subject: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A",
          phone: "01012345678",
          email: "teacher@school.edu",
          salaryType: "fixed",
          salaryAmount: 5e3
        });
        await storage.createUser({ name: "\u0623\u0633\u062A\u0627\u0630 \u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F", email: "teacher@school.edu", password: teachPass, role: "teacher", teacherId: teacher.id });
        console.log("[seed] Default users created: admin@school.edu / admin123");
      }
      const defaults = {
        app_name: "Center M",
        app_tagline: "Center Management",
        semester_start: "2025-09-01",
        semester_end: "2026-06-30",
        grade_a_min: "90",
        grade_b_min: "80",
        grade_c_min: "70",
        grade_d_min: "60",
        currency: "\u062C\u0646\u064A\u0647",
        country_code: "+20",
        primary_color: "#6366f1"
      };
      for (const [key, value] of Object.entries(defaults)) {
        const existing = await storage.getSetting(key);
        if (!existing) await storage.setSetting(key, value);
      }
    } catch (e) {
      console.error("[seed] Auto-seed failed:", e);
    }
  })();
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const HOST = "0.0.0.0";
  server.listen({
    port,
    host: HOST,
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
