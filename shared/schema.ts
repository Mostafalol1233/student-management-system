import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  code: text("code").notNull().unique(),
  gradeLevel: text("grade_level").notNull(),
  section: text("section").notNull(),
  qrPath: text("qr_path"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  status: text("status").notNull(), // present, absent
  timeRecorded: timestamp("time_recorded").defaultNow(),
  scanMethod: text("scan_method").notNull(), // qr, manual
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  subject: text("subject").notNull(),
  assessmentType: text("assessment_type").notNull(),
  score: integer("score").notNull(),
  totalMarks: integer("total_marks").notNull(),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  code: true,
  qrPath: true,
  status: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  timeRecorded: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
  grade: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
