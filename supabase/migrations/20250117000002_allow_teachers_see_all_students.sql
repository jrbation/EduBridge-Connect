-- Allow teachers to see all students for enrollment purposes
drop policy if exists students_select on public.students;

create policy students_select on public.students for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_admin()
    or private.parent_of_student(id)
    or private.current_role() = 'teacher'
    or private.student_in_teacher_class(id)
  );
