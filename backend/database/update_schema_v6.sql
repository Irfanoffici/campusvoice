-- update_schema_v6.sql (Soft Delete Support)

-- 1. Add columns for soft delete
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id);

-- 2. Index for performance (optional but good)
CREATE INDEX IF NOT EXISTS idx_feedback_deletion ON public.feedback(deletion_requested);
