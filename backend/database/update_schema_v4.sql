-- update_schema_v4.sql (RBAC & Manual User Update)

-- 1. Add 'role' to invited_emails to support role assignment on invite
ALTER TABLE public.invited_emails 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'resolver';

-- 2. Update the Trigger Function to copy the role from invite
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if email is in whitelist
  SELECT * INTO invite_record FROM public.invited_emails WHERE email = NEW.email;

  IF FOUND THEN
    -- Auto-approve and assign ROLE from invite (or default to resolver)
    INSERT INTO public.admins (id, email, approved, role)
    VALUES (NEW.id, NEW.email, TRUE, COALESCE(invite_record.role, 'resolver'))
    ON CONFLICT (id) DO UPDATE
    SET approved = TRUE, role = EXCLUDED.role;
  ELSE
    -- Default behavior: Insert as pending resolver
    INSERT INTO public.admins (id, email, approved, role)
    VALUES (NEW.id, NEW.email, FALSE, 'resolver')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure 'resolver' is a valid role constraint (if we had an enum, update it. For text, it's fine).
-- Let's just update existing null roles to 'resolver' to be safe.
UPDATE public.admins SET role = 'resolver' WHERE role IS NULL;
