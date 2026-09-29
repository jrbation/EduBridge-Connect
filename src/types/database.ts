export type UserRole = "student" | "parent" | "teacher" | "admin";
export type AccountStatus = "active" | "inactive";
export type RelationshipStatus = "pending" | "approved" | "revoked";
export type PublishStatus = "draft" | "published" | "archived";
export type SubmissionStatus = "draft" | "submitted" | "graded" | "returned";
export type AttendanceStatus = "present" | "late" | "absent" | "excused";
export type ScheduleType = "class" | "live" | "exam" | "event";
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type ResourceType = "pdf" | "video" | "notes" | "link" | "other";
export type AnnouncementAudience = "all" | "students" | "parents" | "teachers";
export type PaymentStatus = "pending" | "paid" | "overdue" | "waived";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: AccountStatus;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type Fk = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>, Rel extends Fk[] = Fk[]> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rel;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      schools: Table<{
        id: string;
        name: string;
        address: string | null;
        created_at: string;
      }>;
      students: Table<
        {
          id: string;
          profile_id: string;
          school_id: string | null;
          student_number: string | null;
          grade_level: string | null;
          section: string | null;
          connection_code: string;
          created_at: string;
        },
        Partial<{
          id: string;
          profile_id: string;
          school_id: string | null;
          student_number: string | null;
          grade_level: string | null;
          section: string | null;
          connection_code: string;
          created_at: string;
        }>,
        Partial<{
          id: string;
          profile_id: string;
          school_id: string | null;
          student_number: string | null;
          grade_level: string | null;
          section: string | null;
          connection_code: string;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      parents: Table<
        { id: string; profile_id: string; created_at: string },
        Partial<{ id: string; profile_id: string; created_at: string }>,
        Partial<{ id: string; profile_id: string; created_at: string }>,
        [
          {
            foreignKeyName: "parents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      teachers: Table<
        {
          id: string;
          profile_id: string;
          school_id: string | null;
          employee_number: string | null;
          bio: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          profile_id: string;
          school_id: string | null;
          employee_number: string | null;
          bio: string | null;
          created_at: string;
        }>,
        Partial<{
          id: string;
          profile_id: string;
          school_id: string | null;
          employee_number: string | null;
          bio: string | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "teachers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      parent_student_relationships: Table<
        {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          status: RelationshipStatus;
          created_at: string;
        },
        Partial<{
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          status: RelationshipStatus;
          created_at: string;
        }>,
        Partial<{
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          status: RelationshipStatus;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "parent_student_relationships_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parent_student_relationships_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["id"];
          },
        ]
      >;
      classes: Table<
        {
          id: string;
          school_id: string | null;
          teacher_id: string;
          name: string;
          subject: string;
          grade_level: string | null;
          section: string | null;
          description: string | null;
          schedule_label: string | null;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          school_id: string | null;
          teacher_id: string;
          name: string;
          subject: string;
          grade_level: string | null;
          section: string | null;
          description: string | null;
          schedule_label: string | null;
          created_at: string;
          updated_at: string;
        }>,
        Partial<{
          id: string;
          school_id: string | null;
          teacher_id: string;
          name: string;
          subject: string;
          grade_level: string | null;
          section: string | null;
          description: string | null;
          schedule_label: string | null;
          created_at: string;
          updated_at: string;
        }>,
        [
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ]
      >;
      class_students: Table<
        {
          class_id: string;
          student_id: string;
          enrolled_at: string;
        },
        Partial<{
          class_id: string;
          student_id: string;
          enrolled_at: string;
        }>,
        Partial<{
          class_id: string;
          student_id: string;
          enrolled_at: string;
        }>,
        [
          {
            foreignKeyName: "class_students_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_students_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ]
      >;
      courses: Table<
        {
          id: string;
          teacher_id: string;
          class_id: string | null;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          status: PublishStatus;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          teacher_id: string;
          class_id: string | null;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          status: PublishStatus;
          created_at: string;
          updated_at: string;
        }>,
        Partial<{
          id: string;
          teacher_id: string;
          class_id: string | null;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          status: PublishStatus;
          created_at: string;
          updated_at: string;
        }>,
        [
          {
            foreignKeyName: "courses_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ]
      >;
      lessons: Table<
        {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          content: string | null;
          video_url: string | null;
          file_url: string | null;
          sort_order: number;
          created_at: string;
        },
        Partial<{
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          content: string | null;
          video_url: string | null;
          file_url: string | null;
          sort_order: number;
          created_at: string;
        }>,
        Partial<{
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          content: string | null;
          video_url: string | null;
          file_url: string | null;
          sort_order: number;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "lessons_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ]
      >;
      lesson_progress: Table<{
        student_id: string;
        lesson_id: string;
        completed_at: string;
      }>;
      course_favorites: Table<{
        student_id: string;
        course_id: string;
        created_at: string;
      }>;
      resources: Table<{
        id: string;
        course_id: string | null;
        class_id: string | null;
        teacher_id: string;
        title: string;
        description: string | null;
        type: ResourceType;
        file_url: string | null;
        created_at: string;
      }>;
      assignments: Table<
        {
          id: string;
          class_id: string;
          created_by: string;
          title: string;
          description: string | null;
          due_date: string | null;
          points: number;
          attachment_url: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          class_id: string;
          created_by: string;
          title: string;
          description: string | null;
          due_date: string | null;
          points: number;
          attachment_url: string | null;
          created_at: string;
        }>,
        Partial<{
          id: string;
          class_id: string;
          created_by: string;
          title: string;
          description: string | null;
          due_date: string | null;
          points: number;
          attachment_url: string | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "assignments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ]
      >;
      assignment_submissions: Table<
        {
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          submission_text: string | null;
          submitted_at: string | null;
          status: SubmissionStatus;
          created_at: string;
        },
        Partial<{
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          submission_text: string | null;
          submitted_at: string | null;
          status: SubmissionStatus;
          created_at: string;
        }>,
        Partial<{
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          submission_text: string | null;
          submitted_at: string | null;
          status: SubmissionStatus;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ]
      >;
      grades: Table<
        {
          id: string;
          student_id: string;
          assignment_id: string;
          submission_id: string | null;
          score: number;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string;
        },
        Partial<{
          id: string;
          student_id: string;
          assignment_id: string;
          submission_id: string | null;
          score: number;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string;
        }>,
        Partial<{
          id: string;
          student_id: string;
          assignment_id: string;
          submission_id: string | null;
          score: number;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string;
        }>,
        [
          {
            foreignKeyName: "grades_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ]
      >;
      quizzes: Table<{
        id: string;
        course_id: string | null;
        class_id: string | null;
        created_by: string;
        title: string;
        description: string | null;
        time_limit_minutes: number | null;
        created_at: string;
      }>;
      quiz_questions: Table<
        {
          id: string;
          quiz_id: string;
          question: string;
          question_type: QuestionType;
          points: number;
          sort_order: number;
        },
        Partial<{
          id: string;
          quiz_id: string;
          question: string;
          question_type: QuestionType;
          points: number;
          sort_order: number;
        }>,
        Partial<{
          id: string;
          quiz_id: string;
          question: string;
          question_type: QuestionType;
          points: number;
          sort_order: number;
        }>,
        [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ]
      >;
      quiz_answers: Table<
        {
          id: string;
          question_id: string;
          answer: string;
          is_correct: boolean;
          sort_order: number;
        },
        Partial<{
          id: string;
          question_id: string;
          answer: string;
          is_correct: boolean;
          sort_order: number;
        }>,
        Partial<{
          id: string;
          question_id: string;
          answer: string;
          is_correct: boolean;
          sort_order: number;
        }>,
        [
          {
            foreignKeyName: "quiz_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
        ]
      >;
      quiz_attempts: Table<{
        id: string;
        quiz_id: string;
        student_id: string;
        score: number | null;
        started_at: string;
        completed_at: string | null;
      }>;
      quiz_attempt_answers: Table<{
        id: string;
        attempt_id: string;
        question_id: string;
        answer_id: string | null;
        answer_text: string | null;
      }>;
      attendance: Table<
        {
          id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          remarks: string | null;
          marked_by: string | null;
        },
        Partial<{
          id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          remarks: string | null;
          marked_by: string | null;
        }>,
        Partial<{
          id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          remarks: string | null;
          marked_by: string | null;
        }>,
        [
          {
            foreignKeyName: "attendance_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ]
      >;
      schedules: Table<
        {
          id: string;
          class_id: string;
          title: string;
          start_time: string;
          end_time: string;
          type: ScheduleType;
          meeting_url: string | null;
          recording_url: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          class_id: string;
          title: string;
          start_time: string;
          end_time: string;
          type: ScheduleType;
          meeting_url: string | null;
          recording_url: string | null;
          created_at: string;
        }>,
        Partial<{
          id: string;
          class_id: string;
          title: string;
          start_time: string;
          end_time: string;
          type: ScheduleType;
          meeting_url: string | null;
          recording_url: string | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "schedules_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ]
      >;
      announcements: Table<{
        id: string;
        author_id: string;
        class_id: string | null;
        title: string;
        content: string;
        audience: AnnouncementAudience;
        created_at: string;
      }>;
      messages: Table<
        {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        }>,
        Partial<{
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      notifications: Table<{
        id: string;
        user_id: string;
        title: string;
        message: string;
        type: string;
        read_at: string | null;
        created_at: string;
      }>;
      payments: Table<
        {
          id: string;
          student_id: string;
          amount: number;
          status: PaymentStatus;
          description: string;
          due_date: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          student_id: string;
          amount: number;
          status: PaymentStatus;
          description: string;
          due_date: string | null;
          created_at: string;
        }>,
        Partial<{
          id: string;
          student_id: string;
          amount: number;
          status: PaymentStatus;
          description: string;
          due_date: string | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ]
      >;
      audit_logs: Table<{
        id: string;
        actor_id: string | null;
        action: string;
        entity: string;
        entity_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;
      platform_settings: Table<{
        key: string;
        value: Record<string, unknown>;
        updated_at: string;
      }>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      link_child_with_code: {
        Args: { p_code: string; p_relationship?: string };
        Returns: string;
      };
      notify_user: {
        Args: { p_user_id: string; p_title: string; p_message: string; p_type?: string };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
