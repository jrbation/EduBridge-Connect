-- Fix RLS policy to allow admins to change user roles
-- The previous policy prevented role changes even for admins

drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can still update any profile including role changes
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_admin_all on public.profiles for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());
