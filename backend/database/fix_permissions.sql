-- EXECUTE THIS IN SUPABASE SQL EDITOR

-- 1. Fix Admin Logs Visibility
-- The previous policy might have been too strict or missing.
DROP POLICY IF EXISTS "Enable read access for superadmins" ON "public"."admin_logs";

CREATE POLICY "Enable read access for superadmins" ON "public"."admin_logs"
FOR SELECT USING (
  exists (
    select 1 from admins
    where admins.id = auth.uid()
    and admins.role = 'superadmin'
  )
);

-- 2. Fix Admins Row Visibility (Crucial for Strict Approval Check)
-- Users MUST be able to read their OWN 'admins' row to know if they are approved.
DROP POLICY IF EXISTS "Enable read access for own profile" ON "public"."admins";

CREATE POLICY "Enable read access for own profile" ON "public"."admins"
FOR SELECT USING (
  auth.uid() = id
);

-- 3. Ensure Superadmins can see ALL admins (to approve them)
DROP POLICY IF EXISTS "Enable superadmin to see all admins" ON "public"."admins";

CREATE POLICY "Enable superadmin to see all admins" ON "public"."admins"
FOR SELECT USING (
  exists (
    select 1 from admins
    where admins.id = auth.uid()
    and admins.role = 'superadmin'
  )
);
