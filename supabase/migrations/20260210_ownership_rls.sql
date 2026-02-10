-- Ownership-based RLS for announcements and societies
-- Ensures only the creator (auth.uid) can update/delete their records
-- Also enforces that inserts set created_by = auth.uid() for allowlisted users

-- Add created_by column to announcements and societies if missing
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop broad allowlist write policies to tighten to owner-only
DROP POLICY IF EXISTS "PR allowlist can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "PR allowlist can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "PR allowlist can update societies" ON public.societies;
DROP POLICY IF EXISTS "PR allowlist can delete societies" ON public.societies;

-- Insert: allowlisted users must set created_by to themselves
CREATE POLICY "Allowlisted owner can insert announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (public.is_pr_allowlisted() AND created_by = auth.uid());

CREATE POLICY "Allowlisted owner can insert societies"
  ON public.societies
  FOR INSERT
  WITH CHECK (public.is_pr_allowlisted() AND created_by = auth.uid());

-- Update: only allowlisted owner can update
CREATE POLICY "Allowlisted owner can update announcements"
  ON public.announcements
  FOR UPDATE
  USING (public.is_pr_allowlisted() AND auth.uid() = created_by)
  WITH CHECK (public.is_pr_allowlisted() AND auth.uid() = created_by);

CREATE POLICY "Allowlisted owner can update societies"
  ON public.societies
  FOR UPDATE
  USING (public.is_pr_allowlisted() AND auth.uid() = created_by)
  WITH CHECK (public.is_pr_allowlisted() AND auth.uid() = created_by);

-- Delete: only allowlisted owner can delete
CREATE POLICY "Allowlisted owner can delete announcements"
  ON public.announcements
  FOR DELETE
  USING (public.is_pr_allowlisted() AND auth.uid() = created_by);

CREATE POLICY "Allowlisted owner can delete societies"
  ON public.societies
  FOR DELETE
  USING (public.is_pr_allowlisted() AND auth.uid() = created_by);
