// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var students = pgTable("students", {
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
var teachers = pgTable("teachers", {
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
var subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id"),
  price: real("price").default(0),
  sessionsPerMonth: integer("sessions_per_month").default(4),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow()
});
var groups = pgTable("groups", {
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
var enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  subjectId: varchar("subject_id"),
  teacherId: varchar("teacher_id"),
  groupId: varchar("group_id"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var subscriptions = pgTable("subscriptions", {
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
var sessions = pgTable("sessions", {
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
var attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  status: text("status").notNull(),
  timeRecorded: timestamp("time_recorded").defaultNow(),
  scanMethod: text("scan_method").notNull()
});
var grades = pgTable("grades", {
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
var homework = pgTable("homework", {
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
var homeworkSubmissions = pgTable("homework_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeworkId: varchar("homework_id").notNull().references(() => homework.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  score: integer("score"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow()
});
var finances = pgTable("finances", {
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
var studentNotes = pgTable("student_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow()
});
var exams = pgTable("exams", {
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
var examQuestions = pgTable("exam_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id),
  question: text("question").notNull(),
  type: text("type").notNull().default("short"),
  options: text("options"),
  correctAnswer: text("correct_answer"),
  marks: integer("marks").notNull().default(5),
  orderIndex: integer("order_index").default(0)
});
var examSubmissions = pgTable("exam_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  score: integer("score"),
  status: text("status").notNull().default("pending"),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entity: text("entity").notNull(),
  entityId: varchar("entity_id"),
  action: text("action").notNull(),
  actor: text("actor").default("admin"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow()
});
var automationRules = pgTable("automation_rules", {
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
var automationLogs = pgTable("automation_logs", {
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
var appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("reception"),
  teacherId: varchar("teacher_id"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, code: true, qrPath: true, status: true });
var insertTeacherSchema = createInsertSchema(teachers).omit({ id: true, createdAt: true, status: true });
var insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
var insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
var insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, createdAt: true });
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
var insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true, status: true });
var insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, timeRecorded: true });
var insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true, grade: true, sentToParent: true });
var insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true, status: true });
var insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({ id: true, submittedAt: true });
var insertFinanceSchema = createInsertSchema(finances).omit({ id: true, createdAt: true });
var insertStudentNoteSchema = createInsertSchema(studentNotes).omit({ id: true, createdAt: true });
var insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, status: true });
var insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true });
var insertExamSubmissionSchema = createInsertSchema(examSubmissions).omit({ id: true, createdAt: true, gradedAt: true });
var insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
var insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
var insertAutomationRuleSchema = createInsertSchema(automationRules).omit({ id: true, createdAt: true, runCount: true, lastRun: true, status: true });
var insertAutomationLogSchema = createInsertSchema(automationLogs).omit({ id: true, createdAt: true });
var insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
var loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export {
  appSettings,
  attendance,
  auditLogs,
  automationLogs,
  automationRules,
  enrollments,
  examQuestions,
  examSubmissions,
  exams,
  expenses,
  finances,
  grades,
  groups,
  homework,
  homeworkSubmissions,
  insertAttendanceSchema,
  insertAuditLogSchema,
  insertAutomationLogSchema,
  insertAutomationRuleSchema,
  insertEnrollmentSchema,
  insertExamQuestionSchema,
  insertExamSchema,
  insertExamSubmissionSchema,
  insertExpenseSchema,
  insertFinanceSchema,
  insertGradeSchema,
  insertGroupSchema,
  insertHomeworkSchema,
  insertHomeworkSubmissionSchema,
  insertSessionSchema,
  insertStudentNoteSchema,
  insertStudentSchema,
  insertSubjectSchema,
  insertSubscriptionSchema,
  insertTeacherSchema,
  insertUserSchema,
  loginSchema,
  sessions,
  studentNotes,
  students,
  subjects,
  subscriptions,
  teachers,
  users
};
