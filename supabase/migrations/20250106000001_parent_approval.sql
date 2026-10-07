-- Parent-Student Connection Approval Workflow
-- Add rejected status and timestamps for parent-student relationship approval workflow

do $$
begin
  -- Add 'rejected' to relationship_status enum
  alter type public.relationship_status add value 'rejected';
exception
  when duplicate_object then null;
end $$;

-- Add updated_at timestamp to parent_student_relationships
alter table public.parent_student_relationships add column if not exists updated_at timestamptz not null default now();

-- Create trigger to update updated_at
drop trigger if exists parent_student_relationships_updated_at on public.parent_student_relationships;
create trigger parent_student_relationships_updated_at before update on public.parent_student_relationships
for each row execute function public.set_updated_at();

-- Modify link_child_with_code to create pending requests instead of auto-approving
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
  existing_status public.relationship_status;
begin
  if private.current_role() <> 'parent' then
    raise exception 'Only parents can link children';
  end if;

  pid := private.parent_id();
  select id into sid from public.students where connection_code = upper(trim(p_code));
  if sid is null then
    raise exception 'Invalid connection code';
  end if;

  -- Check if relationship already exists
  select status into existing_status
  from public.parent_student_relationships
  where parent_id = pid and student_id = sid;

  if existing_status is not null then
    if existing_status = 'pending' then
      raise exception 'A pending request already exists for this student';
    elsif existing_status = 'approved' then
      raise exception 'You are already connected to this student';
    elsif existing_status = 'revoked' then
      raise exception 'This connection was revoked. Please contact an administrator.';
    else
      raise exception 'A relationship already exists with this student';
    end if;
  end if;

  insert into public.parent_student_relationships (parent_id, student_id, relationship, status)
  values (pid, sid, coalesce(nullif(p_relationship, ''), 'guardian'), 'pending')
  on conflict (parent_id, student_id) do nothing
  returning id into rid;

  return rid;
end;
$$;

-- Create RPC for student to approve parent link
create or replace function public.approve_parent_link(p_relationship_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  rid uuid;
  r_status public.relationship_status;
begin
  if private.current_role() <> 'student' then
    raise exception 'Only students can approve parent connections';
  end if;

  sid := private.student_id();
  if sid is null then
    raise exception 'Student record not found';
  end if;

  select status, id into r_status, rid
  from public.parent_student_relationships
  where id = p_relationship_id and student_id = sid;

  if rid is null then
    raise exception 'Relationship not found';
  end if;

  if r_status <> 'pending' then
    raise exception 'This relationship is not pending approval';
  end if;

  update public.parent_student_relationships
  set status = 'approved'
  where id = p_relationship_id;

  return true;
end;
$$;

-- Create RPC for student to reject parent link
create or replace function public.reject_parent_link(p_relationship_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  rid uuid;
  r_status public.relationship_status;
begin
  if private.current_role() <> 'student' then
    raise exception 'Only students can reject parent connections';
  end if;

  sid := private.student_id();
  if sid is null then
    raise exception 'Student record not found';
  end if;

  select status, id into r_status, rid
  from public.parent_student_relationships
  where id = p_relationship_id and student_id = sid;

  if rid is null then
    raise exception 'Relationship not found';
  end if;

  if r_status <> 'pending' then
    raise exception 'This relationship is not pending approval';
  end if;

  update public.parent_student_relationships
  set status = 'rejected'
  where id = p_relationship_id;

  return true;
end;
$$;

-- Grant execute on new RPCs
grant execute on function public.approve_parent_link(uuid) to authenticated;
grant execute on function public.reject_parent_link(uuid) to authenticated;

-- Update RLS policy to allow students to see their own pending requests
drop policy if exists psr_select on public.parent_student_relationships;
create policy psr_select on public.parent_student_relationships for select to authenticated
  using (
    private.is_admin()
    or parent_id = private.parent_id()
    or student_id = private.student_id()
  );

-- Add policy for students to update their own relationships (approve/reject)
create policy psr_student_update on public.parent_student_relationships for update to authenticated
  using (
    student_id = private.student_id()
    and status = 'pending'
  )
  with check (
    student_id = private.student_id()
    and status in ('approved', 'rejected')
  );
