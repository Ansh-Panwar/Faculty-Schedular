import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  officeLocation: text("office_location").notNull(),
  profileImage: text("profile_image"),
});

export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").notNull().references(() => faculty.id),
  day: text("day").notNull(), // monday, tuesday, etc.
  startTime: text("start_time").notNull(), // 8:00, 9:00, etc.
  endTime: text("end_time").notNull(), // 9:00, 10:00, etc.
  isAvailable: boolean("is_available").notNull(),
  reason: text("reason"), // office hours, teaching, etc.
});

// Define valid appointment status values
export const appointmentStatusEnum = ["pending", "accepted", "rejected"] as const;
export type AppointmentStatus = typeof appointmentStatusEnum[number];

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").notNull().references(() => faculty.id),
  timeSlotId: integer("time_slot_id").notNull().references(() => timeSlots.id),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  appointmentDate: text("appointment_date").notNull(), // YYYY-MM-DD format
  notes: text("notes"),
  status: text("status", { enum: appointmentStatusEnum }).default("pending"), // pending, accepted, rejected
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  token: true,
  createdAt: true,
  status: true,
});

// Booking schema for creating a new appointment
export const bookAppointmentSchema = z.object({
  facultyId: z.number().int().positive(),
  timeSlotId: z.number().int().positive(),
  studentName: z.string().min(2).max(100),
  studentEmail: z.string().email(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  notes: z.string().optional(),
});

// Search schema for faculty availability
export const searchFacultySchema = z.object({
  facultyName: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/), // HH:MM
  endTime: z.string().regex(/^\d{1,2}:\d{2}$/), // HH:MM
});

// Types
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof faculty.$inferSelect;

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type BookAppointment = z.infer<typeof bookAppointmentSchema>;

export type SearchFaculty = z.infer<typeof searchFacultySchema>;

// Specialized types
export interface FacultySearchResult {
  faculty: Faculty;
  availableSlots: TimeSlot[];
  unavailableSlots: TimeSlot[];
}
