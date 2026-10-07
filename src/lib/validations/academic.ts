import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  subject: z.string().min(2, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade is required"),
  section: z.string().optional(),
  description: z.string().optional(),
  scheduleLabel: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  classId: z.string().uuid().optional().or(z.literal("")),
});

export const lessonSchema = z.object({
  courseId: z.string().uuid("Select a course"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export const assignmentSchema = z.object({
  classId: z.string().uuid("Select a class"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  points: z.coerce.number().min(1).max(1000),
});

export const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionText: z.string().min(1, "Write a response or upload a file"),
});

export const gradeSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.coerce.number().min(0),
  feedback: z.string().optional(),
});

export const quizSchema = z.object({
  classId: z.string().uuid("Select a class"),
  title: z.string().min(2),
  description: z.string().optional(),
  timeLimitMinutes: z.coerce.number().min(1).max(180).optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
  audience: z.enum(["all", "students", "parents", "teachers"]),
  classId: z.string().uuid().optional().or(z.literal("")),
});

export const messageSchema = z.object({
  receiverId: z.string().uuid("Select a recipient"),
  content: z.string().min(1, "Message cannot be empty").max(4000),
});

export const attendanceRowSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["present", "late", "absent", "excused"]),
  remarks: z.string().optional(),
});

export const attendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().min(1),
  rows: z.array(attendanceRowSchema).min(1),
});

export const linkChildSchema = z.object({
  code: z.string().min(4, "Enter the student connection code"),
  relationship: z.string().min(2).default("guardian"),
});

export const relationshipIdSchema = z.object({
  relationshipId: z.string().uuid("Invalid relationship ID"),
});

export const schoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
});

export const scheduleSchema = z.object({
  classId: z.string().uuid("Select a class"),
  title: z.string().min(2, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  type: z.enum(["class", "live", "exam", "event"]),
  meetingUrl: z.string().url().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(2, "Description is required"),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "waived"]),
});
