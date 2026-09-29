-- EduBridge Connect — core schema, helpers, RLS, storage

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('student', 'parent', 'teacher', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.relationship_status as enum ('pending', 'approved', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('draft', 'submitted', 'graded', 'returned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'late', 'absent', 'excused');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.schedule_type as enum ('class', 'live', 'exam', 'event');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.question_type as enum ('multiple_choice', 'true_false', 'short_answer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_type as enum ('pdf', 'video', 'notes', 'link', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.announcement_audience as enum ('all', 'students', 'parents', 'teachers');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'overdue', 'waived');
exception when duplicate_object then null;
end $$;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  role public.user_role not null,
  status public.account_status not null default 'active',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  student_number text unique,
  grade_level text,
  section text,
  connection_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  employee_number text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_student_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text not null default 'guardian',
  status public.relationship_status not null default 'approved',
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  name text not null,
  subject text not null,
  grade_level text,
  section text,
  description text,
  schedule_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_students (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  class_id uuid references public.classes(id) on delete set null,
  title text not null,
  description text,
  thumbnail_url text,
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  content text,
  video_url text,
  file_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create table if not exists public.course_favorites (
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, course_id)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  title text not null,
  description text,
  type public.resource_type not null default 'pdf',
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  due_date timestamptz,
  points numeric(6,2) not null default 100,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  file_url text,
  submission_text text,
  submitted_at timestamptz,
  status public.submission_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  submission_id uuid references public.assignment_submissions(id) on delete set null,
  score numeric(6,2) not null,
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz not null default now(),
  unique (student_id, assignment_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  time_limit_minutes int,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  question_type public.question_type not null default 'multiple_choice',
  points numeric(6,2) not null default 1,
  sort_order int not null default 0
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(6,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_id uuid references public.quiz_answers(id) on delete set null,
  answer_text text,
  unique (attempt_id, question_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status public.attendance_status not null,
  remarks text,
  marked_by uuid references public.profiles(id) on delete set null,
  unique (class_id, student_id, date)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  type public.schedule_type not null default 'class',
  meeting_url text,
  recording_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  content text not null,
  audience public.announcement_audience not null default 'all',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_not_self check (sender_id <> receiver_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null,
  status public.payment_status not null default 'pending',
  description text not null,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists students_school_idx on public.students(school_id);
create index if not exists classes_teacher_idx on public.classes(teacher_id);
create index if not exists class_students_student_idx on public.class_students(student_id);
create index if not exists courses_class_idx on public.courses(class_id);
create index if not exists lessons_course_idx on public.lessons(course_id);
create index if not exists assignments_class_idx on public.assignments(class_id);
create index if not exists submissions_student_idx on public.assignment_submissions(student_id);
create index if not exists grades_student_idx on public.grades(student_id);
create index if not exists attendance_class_date_idx on public.attendance(class_id, date);
create index if not exists schedules_class_start_idx on public.schedules(class_id, start_time);
create index if not exists messages_participants_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists quiz_attempts_student_idx on public.quiz_attempts(student_id, quiz_id);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists classes_updated_at on public.classes;
create trigger classes_updated_at before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth bootstrap (role is stored on profiles, never trusted from user JWT metadata)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.user_role;
  full_name text;
begin
  chosen_role := coalesce(nullif(new.raw_user_meta_data->>'role', '')::public.user_role, 'student');
  if chosen_role = 'admin' then
    chosen_role := 'student';
  end if;

  full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1));

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, full_name, chosen_role)
  on conflict (id) do nothing;

  if chosen_role = 'student' then
    insert into public.students (profile_id, connection_code, student_number)
    values (
      new.id,
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
      'STU-' || substr(replace(new.id::text, '-', ''), 1, 8)
    )
    on conflict (profile_id) do nothing;
  elsif chosen_role = 'parent' then
    insert into public.parents (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  elsif chosen_role = 'teacher' then
    insert into public.teachers (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Private authorization helpers (not exposed via PostgREST)
-- ---------------------------------------------------------------------------

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function private.student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where profile_id = auth.uid();
$$;

create or replace function private.parent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.parents where profile_id = auth.uid();
$$;

create or replace function private.teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers where profile_id = auth.uid();
$$;

create or replace function private.is_teacher_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.teacher_id = private.teacher_id()
  );
$$;

create or replace function private.is_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_students cs
    where cs.class_id = p_class_id and cs.student_id = private.student_id()
  );
$$;

create or replace function private.parent_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_student_relationships r
    where r.parent_id = private.parent_id()
      and r.student_id = p_student_id
      and r.status = 'approved'
  );
$$;

create or replace function private.student_in_teacher_class(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = p_student_id
      and c.teacher_id = private.teacher_id()
  );
$$;

revoke all on schema private from public, anon;
grant usage on schema private to postgres, service_role, authenticated;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.teachers enable row level security;
alter table public.parent_student_relationships enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_favorites enable row level security;
alter table public.resources enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.grades enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.attendance enable row level security;
alter table public.schedules enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;

-- Profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or private.is_admin()
    or private.current_role() = 'teacher'
    or (
      private.current_role() = 'parent'
      and (
        exists (
          select 1 from public.students s
          where s.profile_id = profiles.id and private.parent_of_student(s.id)
        )
        or exists (
          select 1 from public.teachers t where t.profile_id = profiles.id
        )
      )
    )
    or (
      private.current_role() = 'student'
      and (
        exists (
          select 1 from public.teachers t where t.profile_id = profiles.id
        )
        or exists (
          select 1
          from public.students s
          join public.class_students cs on cs.student_id = s.id
          join public.class_students me on me.class_id = cs.class_id
          where s.profile_id = profiles.id and me.student_id = private.student_id()
        )
      )
    )
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Schools
drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to authenticated using (true);
drop policy if exists schools_admin_write on public.schools;
create policy schools_admin_write on public.schools for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Students
drop policy if exists students_select on public.students;
create policy students_select on public.students for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_admin()
    or private.parent_of_student(id)
    or private.student_in_teacher_class(id)
  );

drop policy if exists students_update_self on public.students;
create policy students_update_self on public.students for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists students_admin on public.students;
create policy students_admin on public.students for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Parents / teachers
drop policy if exists parents_select on public.parents;
create policy parents_select on public.parents for select to authenticated
  using (profile_id = auth.uid() or private.is_admin() or private.current_role() in ('teacher', 'admin'));
drop policy if exists parents_admin on public.parents;
create policy parents_admin on public.parents for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists teachers_select on public.teachers;
create policy teachers_select on public.teachers for select to authenticated using (true);
drop policy if exists teachers_update_self on public.teachers;
create policy teachers_update_self on public.teachers for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists teachers_admin on public.teachers;
create policy teachers_admin on public.teachers for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Relationships
drop policy if exists psr_select on public.parent_student_relationships;
create policy psr_select on public.parent_student_relationships for select to authenticated
  using (
    private.is_admin()
    or parent_id = private.parent_id()
    or student_id = private.student_id()
  );
drop policy if exists psr_insert_parent on public.parent_student_relationships;
create policy psr_insert_parent on public.parent_student_relationships for insert to authenticated
  with check (parent_id = private.parent_id());
drop policy if exists psr_admin on public.parent_student_relationships;
create policy psr_admin on public.parent_student_relationships for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Classes
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (
    private.is_admin()
    or teacher_id = private.teacher_id()
    or private.is_enrolled_in_class(id)
    or exists (
      select 1 from public.class_students cs
      where cs.class_id = classes.id and private.parent_of_student(cs.student_id)
    )
  );
drop policy if exists classes_teacher_write on public.classes;
create policy classes_teacher_write on public.classes for insert to authenticated
  with check (teacher_id = private.teacher_id() or private.is_admin());
drop policy if exists classes_teacher_update on public.classes;
create policy classes_teacher_update on public.classes for update to authenticated
  using (teacher_id = private.teacher_id() or private.is_admin())
  with check (teacher_id = private.teacher_id() or private.is_admin());
drop policy if exists classes_teacher_delete on public.classes;
create policy classes_teacher_delete on public.classes for delete to authenticated
  using (teacher_id = private.teacher_id() or private.is_admin());

-- Enrollments
drop policy if exists class_students_select on public.class_students;
create policy class_students_select on public.class_students for select to authenticated
  using (
    private.is_admin()
    or student_id = private.student_id()
    or private.parent_of_student(student_id)
    or private.is_teacher_of_class(class_id)
  );
drop policy if exists class_students_teacher_write on public.class_students;
create policy class_students_teacher_write on public.class_students for all to authenticated
  using (private.is_teacher_of_class(class_id) or private.is_admin())
  with check (private.is_teacher_of_class(class_id) or private.is_admin());

-- Courses / lessons
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select to authenticated
  using (
    status = 'published'
    and (
      private.is_admin()
      or teacher_id = private.teacher_id()
      or (class_id is not null and private.is_enrolled_in_class(class_id))
      or exists (
        select 1 from public.class_students cs
        where cs.class_id = courses.class_id and private.parent_of_student(cs.student_id)
      )
    )
    or teacher_id = private.teacher_id()
    or private.is_admin()
  );
drop policy if exists courses_teacher_write on public.courses;
create policy courses_teacher_write on public.courses for all to authenticated
  using (teacher_id = private.teacher_id() or private.is_admin())
  with check (teacher_id = private.teacher_id() or private.is_admin());

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select to authenticated
  using (
    exists (select 1 from public.courses c where c.id = course_id)
  );
drop policy if exists lessons_teacher_write on public.lessons;
create policy lessons_teacher_write on public.lessons for all to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.courses c where c.id = course_id and c.teacher_id = private.teacher_id()
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.courses c where c.id = course_id and c.teacher_id = private.teacher_id()
    )
  );

drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select to authenticated
  using (student_id = private.student_id() or private.parent_of_student(student_id) or private.is_admin() or private.student_in_teacher_class(student_id));
drop policy if exists lesson_progress_student_write on public.lesson_progress;
create policy lesson_progress_student_write on public.lesson_progress for insert to authenticated
  with check (student_id = private.student_id());
drop policy if exists lesson_progress_student_update on public.lesson_progress;
create policy lesson_progress_student_update on public.lesson_progress for update to authenticated
  using (student_id = private.student_id())
  with check (student_id = private.student_id());

drop policy if exists favorites_own on public.course_favorites;
create policy favorites_own on public.course_favorites for all to authenticated
  using (student_id = private.student_id()) with check (student_id = private.student_id());

drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources for select to authenticated
  using (
    private.is_admin()
    or teacher_id = private.teacher_id()
    or (class_id is not null and private.is_enrolled_in_class(class_id))
    or (course_id is not null and exists (select 1 from public.courses c where c.id = course_id))
    or exists (
      select 1 from public.class_students cs
      where cs.class_id = resources.class_id and private.parent_of_student(cs.student_id)
    )
  );
drop policy if exists resources_teacher_write on public.resources;
create policy resources_teacher_write on public.resources for all to authenticated
  using (teacher_id = private.teacher_id() or private.is_admin())
  with check (teacher_id = private.teacher_id() or private.is_admin());

-- Assignments
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select to authenticated
  using (
    private.is_admin()
    or private.is_teacher_of_class(class_id)
    or private.is_enrolled_in_class(class_id)
    or exists (
      select 1 from public.class_students cs
      where cs.class_id = assignments.class_id and private.parent_of_student(cs.student_id)
    )
  );
drop policy if exists assignments_teacher_write on public.assignments;
create policy assignments_teacher_write on public.assignments for all to authenticated
  using (private.is_teacher_of_class(class_id) or private.is_admin())
  with check (private.is_teacher_of_class(class_id) or private.is_admin());

drop policy if exists submissions_select on public.assignment_submissions;
create policy submissions_select on public.assignment_submissions for select to authenticated
  using (
    student_id = private.student_id()
    or private.parent_of_student(student_id)
    or private.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.is_teacher_of_class(a.class_id)
    )
  );
drop policy if exists submissions_student_write on public.assignment_submissions;
create policy submissions_student_write on public.assignment_submissions for insert to authenticated
  with check (student_id = private.student_id());
drop policy if exists submissions_student_update on public.assignment_submissions;
create policy submissions_student_update on public.assignment_submissions for update to authenticated
  using (student_id = private.student_id() and status in ('draft', 'returned', 'submitted'))
  with check (student_id = private.student_id() and status in ('draft', 'returned', 'submitted'));
drop policy if exists submissions_teacher_update on public.assignment_submissions;
create policy submissions_teacher_update on public.assignment_submissions for update to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.is_teacher_of_class(a.class_id)
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.is_teacher_of_class(a.class_id)
    )
  );

drop policy if exists grades_select on public.grades;
create policy grades_select on public.grades for select to authenticated
  using (
    student_id = private.student_id()
    or private.parent_of_student(student_id)
    or private.student_in_teacher_class(student_id)
    or private.is_admin()
  );
drop policy if exists grades_teacher_write on public.grades;
create policy grades_teacher_write on public.grades for all to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.is_teacher_of_class(a.class_id)
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.is_teacher_of_class(a.class_id)
    )
  );

-- Quizzes
drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes for select to authenticated
  using (
    private.is_admin()
    or created_by = auth.uid()
    or (class_id is not null and (private.is_enrolled_in_class(class_id) or private.is_teacher_of_class(class_id)))
    or exists (
      select 1 from public.class_students cs
      where cs.class_id = quizzes.class_id and private.parent_of_student(cs.student_id)
    )
  );
drop policy if exists quizzes_teacher_write on public.quizzes;
create policy quizzes_teacher_write on public.quizzes for all to authenticated
  using (created_by = auth.uid() or private.is_admin() or (class_id is not null and private.is_teacher_of_class(class_id)))
  with check (created_by = auth.uid() or private.is_admin());

drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions for select to authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id));
drop policy if exists quiz_questions_write on public.quiz_questions;
create policy quiz_questions_write on public.quiz_questions for all to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.quizzes q where q.id = quiz_id and (q.created_by = auth.uid() or (q.class_id is not null and private.is_teacher_of_class(q.class_id)))
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.quizzes q where q.id = quiz_id and q.created_by = auth.uid()
    )
  );

drop policy if exists quiz_answers_select on public.quiz_answers;
create policy quiz_answers_select on public.quiz_answers for select to authenticated
  using (exists (select 1 from public.quiz_questions qq where qq.id = question_id));
drop policy if exists quiz_answers_write on public.quiz_answers;
create policy quiz_answers_write on public.quiz_answers for all to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.created_by = auth.uid()
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.created_by = auth.uid()
    )
  );

drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (student_id = private.student_id() or private.parent_of_student(student_id) or private.is_admin() or private.student_in_teacher_class(student_id));
drop policy if exists quiz_attempts_student_write on public.quiz_attempts;
create policy quiz_attempts_student_write on public.quiz_attempts for insert to authenticated
  with check (student_id = private.student_id());
drop policy if exists quiz_attempts_student_update on public.quiz_attempts;
create policy quiz_attempts_student_update on public.quiz_attempts for update to authenticated
  using (student_id = private.student_id()) with check (student_id = private.student_id());

drop policy if exists quiz_attempt_answers_select on public.quiz_attempt_answers;
create policy quiz_attempt_answers_select on public.quiz_attempt_answers for select to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id
        and (a.student_id = private.student_id() or private.parent_of_student(a.student_id) or private.is_admin() or private.student_in_teacher_class(a.student_id))
    )
  );
drop policy if exists quiz_attempt_answers_write on public.quiz_attempt_answers;
create policy quiz_attempt_answers_write on public.quiz_attempt_answers for all to authenticated
  using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.student_id = private.student_id())
  )
  with check (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.student_id = private.student_id())
  );

-- Attendance / schedules / announcements
drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance for select to authenticated
  using (
    student_id = private.student_id()
    or private.parent_of_student(student_id)
    or private.is_teacher_of_class(class_id)
    or private.is_admin()
  );
drop policy if exists attendance_teacher_write on public.attendance;
create policy attendance_teacher_write on public.attendance for all to authenticated
  using (private.is_teacher_of_class(class_id) or private.is_admin())
  with check (private.is_teacher_of_class(class_id) or private.is_admin());

drop policy if exists schedules_select on public.schedules;
create policy schedules_select on public.schedules for select to authenticated
  using (
    private.is_admin()
    or private.is_teacher_of_class(class_id)
    or private.is_enrolled_in_class(class_id)
    or exists (
      select 1 from public.class_students cs
      where cs.class_id = schedules.class_id and private.parent_of_student(cs.student_id)
    )
  );
drop policy if exists schedules_teacher_write on public.schedules;
create policy schedules_teacher_write on public.schedules for all to authenticated
  using (private.is_teacher_of_class(class_id) or private.is_admin())
  with check (private.is_teacher_of_class(class_id) or private.is_admin());

drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements for select to authenticated
  using (
    private.is_admin()
    or author_id = auth.uid()
    or (
      (
        audience = 'all'
        or (audience = 'students' and private.current_role() = 'student')
        or (audience = 'parents' and private.current_role() = 'parent')
        or (audience = 'teachers' and private.current_role() = 'teacher')
      )
      and (
        class_id is null
        or private.is_enrolled_in_class(class_id)
        or private.is_teacher_of_class(class_id)
        or exists (
          select 1 from public.class_students cs
          where cs.class_id = announcements.class_id and private.parent_of_student(cs.student_id)
        )
      )
    )
  );
drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all to authenticated
  using (
    private.is_admin()
    or private.current_role() = 'teacher'
  )
  with check (
    private.is_admin() or private.current_role() = 'teacher'
  );

-- Messages / notifications
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or private.is_admin());
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid());
drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages for update to authenticated
  using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select to authenticated
  using (user_id = auth.uid() or private.is_admin());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications for insert to authenticated
  with check (private.is_admin() or private.current_role() = 'teacher' or user_id = auth.uid());

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated
  using (
    private.is_admin()
    or exists (select 1 from public.students s where s.id = student_id and s.profile_id = auth.uid())
    or private.parent_of_student(student_id)
  );
drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists audit_admin on public.audit_logs;
create policy audit_admin on public.audit_logs for select to authenticated using (private.is_admin());
drop policy if exists audit_insert_staff on public.audit_logs;
create policy audit_insert_staff on public.audit_logs for insert to authenticated
  with check (private.is_admin() or private.current_role() = 'teacher');

drop policy if exists settings_select on public.platform_settings;
create policy settings_select on public.platform_settings for select to authenticated using (true);
drop policy if exists settings_admin on public.platform_settings;
create policy settings_admin on public.platform_settings for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('submissions', 'submissions', false),
  ('resources', 'resources', false)
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists submissions_read on storage.objects;
create policy submissions_read on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or private.is_admin()
      or private.current_role() = 'teacher'
    )
  );
drop policy if exists submissions_write on storage.objects;
create policy submissions_write on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists submissions_update on storage.objects;
create policy submissions_update on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists resources_read on storage.objects;
create policy resources_read on storage.objects for select to authenticated
  using (bucket_id = 'resources');
drop policy if exists resources_write_staff on storage.objects;
create policy resources_write_staff on storage.objects for insert to authenticated
  with check (bucket_id = 'resources' and private.current_role() in ('teacher', 'admin'));
drop policy if exists resources_update_staff on storage.objects;
create policy resources_update_staff on storage.objects for update to authenticated
  using (bucket_id = 'resources' and private.current_role() in ('teacher', 'admin'))
  with check (bucket_id = 'resources' and private.current_role() in ('teacher', 'admin'));

-- Parent link RPC
create or replace function public.link_child_with_code(p_code text, p_relationship text default 'guardian')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  pid uuid;
  rid uuid;
begin
  if private.current_role() <> 'parent' then
    raise exception 'Only parents can link children';
  end if;

  pid := private.parent_id();
  select id into sid from public.students where connection_code = upper(trim(p_code));
  if sid is null then
    raise exception 'Invalid connection code';
  end if;

  insert into public.parent_student_relationships (parent_id, student_id, relationship, status)
  values (pid, sid, coalesce(nullif(p_relationship, ''), 'guardian'), 'approved')
  on conflict (parent_id, student_id) do update
    set status = 'approved', relationship = excluded.relationship
  returning id into rid;

  return rid;
end;
$$;

grant execute on function public.link_child_with_code(text, text) to authenticated;

create or replace function public.notify_user(p_user_id uuid, p_title text, p_message text, p_type text default 'general')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.notifications (user_id, title, message, type)
  values (p_user_id, p_title, p_message, coalesce(nullif(p_type, ''), 'general'));
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text) from public, anon;
grant execute on function public.notify_user(uuid, text, text, text) to authenticated, service_role;
-- QA fixes: notifications, resubmits, announcement audience, parent-teacher messaging, lesson progress upsert

create or replace function public.notify_user(p_user_id uuid, p_title text, p_message text, p_type text default 'general')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.notifications (user_id, title, message, type)
  values (p_user_id, p_title, p_message, coalesce(nullif(p_type, ''), 'general'));
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text) from public, anon;
grant execute on function public.notify_user(uuid, text, text, text) to authenticated, service_role;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or private.is_admin()
    or private.current_role() = 'teacher'
    or (
      private.current_role() = 'parent'
      and (
        exists (
          select 1 from public.students s
          where s.profile_id = profiles.id and private.parent_of_student(s.id)
        )
        or exists (
          select 1 from public.teachers t where t.profile_id = profiles.id
        )
      )
    )
    or (
      private.current_role() = 'student'
      and (
        exists (
          select 1 from public.teachers t where t.profile_id = profiles.id
        )
        or exists (
          select 1
          from public.students s
          join public.class_students cs on cs.student_id = s.id
          join public.class_students me on me.class_id = cs.class_id
          where s.profile_id = profiles.id and me.student_id = private.student_id()
        )
      )
    )
  );

drop policy if exists submissions_student_update on public.assignment_submissions;
create policy submissions_student_update on public.assignment_submissions for update to authenticated
  using (student_id = private.student_id() and status in ('draft', 'returned', 'submitted'))
  with check (student_id = private.student_id() and status in ('draft', 'returned', 'submitted'));

drop policy if exists lesson_progress_student_write on public.lesson_progress;
create policy lesson_progress_student_write on public.lesson_progress for insert to authenticated
  with check (student_id = private.student_id());
drop policy if exists lesson_progress_student_update on public.lesson_progress;
create policy lesson_progress_student_update on public.lesson_progress for update to authenticated
  using (student_id = private.student_id())
  with check (student_id = private.student_id());

drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements for select to authenticated
  using (
    private.is_admin()
    or author_id = auth.uid()
    or (
      (
        audience = 'all'
        or (audience = 'students' and private.current_role() = 'student')
        or (audience = 'parents' and private.current_role() = 'parent')
        or (audience = 'teachers' and private.current_role() = 'teacher')
      )
      and (
        class_id is null
        or private.is_enrolled_in_class(class_id)
        or private.is_teacher_of_class(class_id)
        or exists (
          select 1 from public.class_students cs
          where cs.class_id = announcements.class_id and private.parent_of_student(cs.student_id)
        )
      )
    )
  );
