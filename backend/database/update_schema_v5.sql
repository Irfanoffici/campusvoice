-- update_schema_v5.sql (Fix Role Constraint)

-- We previously added 'resolver' support but forgot to update the table constraint.

-- 1. Drop the old constraint that restricted roles to specific values
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_role_check;

-- 2. Add the new constraint including 'resolver'
ALTER TABLE public.admins ADD CONSTRAINT admins_role_check 
CHECK (role IN ('resolver', 'admin', 'superadmin'));

-- 3. Verify roles
UPDATE public.admins SET role = 'resolver' WHERE role NOT IN ('admin', 'superadmin', 'resolver');
