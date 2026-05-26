import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  section: text("section").notNull(),
  subject: text("subject"),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  groupId: varchar("group_id"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  status: text("status").notNull(),
  timeRecorded: timestamp("time_recorded").defaultNow(),
  scanMethod: text("scan_method").notNull(),
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  subject: text("subject").notNull(),
  assessmentType: text("assessment_type").notNull(),
  score: integer("score").notNull(),
  totalMarks: integer("total_marks").notNull(),
  weight: real("weight").default(1.0),
  grade: text("grade"),
  notes: text("notes"),
  sentToParent: boolean("sent_to_parent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const homework = pgTable("homework", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  groupId: varchar("group_id"),
  deadline: text("deadline").notNull(),
  totalMarks: integer("total_marks").default(10),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeworkId: varchar("homework_id").notNull().references(() => homework.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  score: integer("score"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const finances = pgTable("finances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  type: text("type").notNull().default("subscription"),
  amount: real("amount").notNull(),
  paid: real("paid").default(0),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, code: true, qrPath: true, status: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true, status: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, timeRecorded: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true, grade: true, sentToParent: true });
export const insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true, status: true });
export const insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({ id: true, submittedAt: true });
export const insertFinanceSchema = createInsertSchema(finances).omit({ id: true, createdAt: true });

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Homework = typeof homework.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type InsertHomeworkSubmission = z.infer<typeof insertHomeworkSubmissionSchema>;
export type Finance = typeof finances.$inferSelect;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;
