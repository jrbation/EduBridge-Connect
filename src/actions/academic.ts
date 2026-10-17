"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getStudentRecord, notify } from "@/lib/data/records";
import {
  assignmentSchema,
  gradeSchema,
  quizSchema,
  classSchema,
  courseSchema,
  lessonSchema,
  announcementSchema,
  attendanceSchema,
  scheduleSchema,
} from "@/lib/validations/academic";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createClassAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = classSchema.safeParse({
    name: str(formData, "name"),
    subject: str(formData, "subject"),
    gradeLevel: str(formData, "gradeLevel"),
    section: str(formData, "section"),
    description: str(formData, "description"),
    scheduleLabel: str(formData, "scheduleLabel"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid class" };
  const supabase = await createClient();
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
  if (!teacher) return { error: "Teacher profile missing" };
  const { error } = await supabase.from("classes").insert({
    teacher_id: teacher.id,
    name: parsed.data.name,
    subject: parsed.data.subject,
    grade_level: parsed.data.gradeLevel,
    section: parsed.data.section || null,
    description: parsed.data.description || null,
    schedule_label: parsed.data.scheduleLabel || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
  redirect("/teacher/classes");
}

export async function deleteClassAction(formData: FormData) {
  await requireRole("teacher");
  const classId = str(formData, "classId");
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) return { error: error.message };
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
  revalidatePath("/teacher/students");
  redirect("/teacher/classes");
}

export async function enrollStudentAction(formData: FormData) {
  await requireRole("teacher");
  const classId = str(formData, "classId");
  const studentNumber = str(formData, "studentNumber");
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, profile_id")
    .eq("student_number", studentNumber)
    .maybeSingle();
  if (!student) return { error: "Student not found" };
  const { error } = await supabase.from("class_students").insert({ class_id: classId, student_id: student.id });
  if (error) {
    if (error.code === "23505") {
      return { error: "Student is already enrolled in this class" };
    }
    return { error: error.message };
  }
  await notify(student.profile_id, "Added to a class", "You were enrolled in a new class.", "class");
  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function removeStudentAction(formData: FormData) {
  await requireRole("teacher");
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_students")
    .delete()
    .eq("class_id", str(formData, "classId"))
    .eq("student_id", str(formData, "studentId"));
  if (error) return { error: error.message };
  revalidatePath("/teacher/students");
  return { success: "Student removed" };
}

export async function createCourseAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = courseSchema.safeParse({
    title: str(formData, "title"),
    description: str(formData, "description"),
    classId: str(formData, "classId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid course" };
  const supabase = await createClient();
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
  if (!teacher) return { error: "Teacher profile missing" };
  const { error } = await supabase.from("courses").insert({
    teacher_id: teacher.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    class_id: parsed.data.classId || null,
    status: "published",
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/courses");
  return { success: "Course created" };
}

export async function createLessonAction(formData: FormData) {
  await requireRole("teacher");
  const parsed = lessonSchema.safeParse({
    courseId: str(formData, "courseId"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    content: str(formData, "content"),
    videoUrl: str(formData, "videoUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid lesson" };
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").insert({
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    content: parsed.data.content || null,
    video_url: parsed.data.videoUrl || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/lessons");
  return { success: "Lesson created" };
}

export async function createAssignmentAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = assignmentSchema.safeParse({
    classId: str(formData, "classId"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    dueDate: str(formData, "dueDate"),
    points: str(formData, "points"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid assignment" };
  const supabase = await createClient();
  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      class_id: parsed.data.classId,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate,
      points: parsed.data.points,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { data: roster } = await supabase
    .from("class_students")
    .select("students(profile_id)")
    .eq("class_id", parsed.data.classId);
  for (const row of roster ?? []) {
    const nested = row.students as { profile_id: string } | { profile_id: string }[] | null;
    const profileId = Array.isArray(nested) ? nested[0]?.profile_id : nested?.profile_id;
    if (profileId) {
      await notify(profileId, "New assignment", parsed.data.title, "assignment");
    }
  }
  void assignment;
  revalidatePath("/teacher/assignments");
  return { success: "Assignment published" };
}

export async function gradeSubmissionAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = gradeSchema.safeParse({
    submissionId: str(formData, "submissionId"),
    score: str(formData, "score"),
    feedback: str(formData, "feedback"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid grade" };
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("id, assignment_id, student_id, assignments(points, title)")
    .eq("id", parsed.data.submissionId)
    .single();
  if (!submission) return { error: "Submission not found" };
  const assignmentMeta = submission.assignments as { points: number; title: string } | { points: number; title: string }[] | null;
  const points = Array.isArray(assignmentMeta) ? assignmentMeta[0]?.points : assignmentMeta?.points;
  const title = Array.isArray(assignmentMeta) ? assignmentMeta[0]?.title : assignmentMeta?.title;
  if (points != null && parsed.data.score > Number(points)) return { error: "Score cannot exceed assignment points" };

  await supabase
    .from("assignment_submissions")
    .update({ status: "graded" })
    .eq("id", submission.id);

  const { error } = await supabase.from("grades").upsert(
    {
      student_id: submission.student_id,
      assignment_id: submission.assignment_id,
      submission_id: submission.id,
      score: parsed.data.score,
      feedback: parsed.data.feedback || null,
      graded_by: profile.id,
      graded_at: new Date().toISOString(),
    },
    { onConflict: "student_id,assignment_id" },
  );
  if (error) return { error: error.message };

  const { data: student } = await supabase.from("students").select("profile_id").eq("id", submission.student_id).single();
  if (student) await notify(student.profile_id, "Grade released", `${title ?? "Assignment"} has been graded.`, "grade");
  revalidatePath("/teacher/grading");
  return { success: "Grade saved" };
}

export async function saveAttendanceAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const classId = str(formData, "classId");
  const date = str(formData, "date");
  const raw = str(formData, "payload");
  let rows: { studentId: string; status: "present" | "late" | "absent" | "excused"; remarks?: string }[] = [];
  try {
    rows = JSON.parse(raw) as typeof rows;
  } catch {
    return { error: "Invalid attendance payload" };
  }
  const parsed = attendanceSchema.safeParse({ classId, date, rows });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid attendance" };
  const supabase = await createClient();
  const records = parsed.data.rows.map((row) => ({
    class_id: parsed.data.classId,
    student_id: row.studentId,
    date: parsed.data.date,
    status: row.status,
    remarks: row.remarks || null,
    marked_by: profile.id,
  }));
  const { error } = await supabase.from("attendance").upsert(records, { onConflict: "class_id,student_id,date" });
  if (error) return { error: error.message };
  revalidatePath("/teacher/attendance");
  return { success: "Attendance saved" };
}

export async function createAnnouncementAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = announcementSchema.safeParse({
    title: str(formData, "title"),
    content: str(formData, "content"),
    audience: str(formData, "audience"),
    classId: str(formData, "classId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid announcement" };
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    author_id: profile.id,
    title: parsed.data.title,
    content: parsed.data.content,
    audience: parsed.data.audience,
    class_id: parsed.data.classId || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/announcements");
  return { success: "Announcement posted" };
}

export async function createQuizAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const parsed = quizSchema.safeParse({
    classId: str(formData, "classId"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    timeLimitMinutes: str(formData, "timeLimitMinutes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid quiz" };
  const supabase = await createClient();
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      class_id: parsed.data.classId,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      time_limit_minutes: parsed.data.timeLimitMinutes ?? 15,
    })
    .select("id")
    .single();
  if (error || !quiz) return { error: error?.message ?? "Could not create quiz" };

  const question = str(formData, "question");
  const a1 = str(formData, "answer1");
  const a2 = str(formData, "answer2");
  const a3 = str(formData, "answer3");
  const a4 = str(formData, "answer4");
  const correct = Number(str(formData, "correct") || "1");
  if (question && a1 && a2) {
    const { data: q } = await supabase
      .from("quiz_questions")
      .insert({ quiz_id: quiz.id, question, question_type: "multiple_choice", points: 1, sort_order: 1 })
      .select("id")
      .single();
    if (q) {
      const answers = [a1, a2, a3, a4].filter(Boolean);
      await supabase.from("quiz_answers").insert(
        answers.map((answer, index) => ({
          question_id: q.id,
          answer,
          is_correct: index + 1 === correct,
          sort_order: index + 1,
        })),
      );
    }
  }
  revalidatePath("/teacher/quizzes");
  return { success: "Quiz created" };
}

export async function createResourceAction(formData: FormData) {
  const profile = await requireRole("teacher");
  const supabase = await createClient();
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
  if (!teacher) return { error: "Teacher profile missing" };
  const { error } = await supabase.from("resources").insert({
    teacher_id: teacher.id,
    class_id: str(formData, "classId") || null,
    title: str(formData, "title"),
    description: str(formData, "description") || null,
    type: (str(formData, "type") || "pdf") as "pdf" | "video" | "notes" | "link" | "other",
    file_url: str(formData, "fileUrl") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/lessons");
  return { success: "Resource added" };
}

export async function createScheduleAction(formData: FormData) {
  await requireRole("teacher");
  const parsed = scheduleSchema.safeParse({
    classId: str(formData, "classId"),
    title: str(formData, "title"),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    type: str(formData, "type"),
    meetingUrl: str(formData, "meetingUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid schedule" };
  const supabase = await createClient();
  const { error } = await supabase.from("schedules").insert({
    class_id: parsed.data.classId,
    title: parsed.data.title,
    start_time: new Date(parsed.data.startTime).toISOString(),
    end_time: new Date(parsed.data.endTime).toISOString(),
    type: parsed.data.type,
    meeting_url: parsed.data.meetingUrl || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/calendar");
  return { success: "Session scheduled" };
}

export async function submitAssignmentAction(formData: FormData) {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  if (!student) return { error: "Student record missing" };
  const assignmentId = str(formData, "assignmentId");
  const submissionText = str(formData, "submissionText");
  const supabase = await createClient();

  let fileUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { error: "File must be 10MB or smaller" };
    const path = `${profile.id}/${assignmentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };
    fileUrl = path;
  }
  if (!submissionText && !fileUrl) return { error: "Add a written response or a file" };

  const { error } = await supabase.from("assignment_submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: student.id,
      submission_text: submissionText || null,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    },
    { onConflict: "assignment_id,student_id" },
  );
  if (error) return { error: error.message };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("created_by, title")
    .eq("id", assignmentId)
    .single();
  if (assignment?.created_by) {
    await notify(assignment.created_by, "New submission", `${profile.full_name} submitted ${assignment.title}`, "submission");
  }
  revalidatePath("/student/assignments");
  return { success: "Assignment submitted" };
}

export async function toggleFavoriteAction(courseId: string) {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  if (!student) return { error: "Student record missing" };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("course_favorites")
    .select("course_id")
    .eq("student_id", student.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    await supabase.from("course_favorites").delete().eq("student_id", student.id).eq("course_id", courseId);
  } else {
    await supabase.from("course_favorites").insert({ student_id: student.id, course_id: courseId });
  }
  revalidatePath("/student/courses");
  return { success: "Saved" };
}

export async function completeLessonAction(lessonId: string) {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  if (!student) return { error: "Student record missing" };
  const supabase = await createClient();
  await supabase.from("lesson_progress").upsert({ student_id: student.id, lesson_id: lessonId });
  revalidatePath("/student/courses");
  return { success: "Lesson marked complete" };
}

export async function submitQuizAction(formData: FormData) {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  if (!student) return { error: "Student record missing" };
  const quizId = str(formData, "quizId");
  const supabase = await createClient();
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: student.id })
    .select("id")
    .single();
  if (attemptError || !attempt) return { error: attemptError?.message ?? "Could not start attempt" };

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, points, quiz_answers(id, is_correct)")
    .eq("quiz_id", quizId);
  let earned = 0;
  let total = 0;
  for (const question of questions ?? []) {
    total += Number(question.points);
    const selected = str(formData, `q_${question.id}`);
    const answers = (question.quiz_answers ?? []) as { id: string; is_correct: boolean }[];
    const chosen = answers.find((a) => a.id === selected);
    if (chosen?.is_correct) earned += Number(question.points);
    await supabase.from("quiz_attempt_answers").insert({
      attempt_id: attempt.id,
      question_id: question.id,
      answer_id: selected || null,
    });
  }
  const score = total ? Math.round((earned / total) * 100) : 0;
  await supabase
    .from("quiz_attempts")
    .update({ score, completed_at: new Date().toISOString() })
    .eq("id", attempt.id);
  revalidatePath("/student/assignments");
  return { success: `Quiz submitted. Score: ${score}%` };
}
