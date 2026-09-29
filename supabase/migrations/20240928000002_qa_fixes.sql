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
