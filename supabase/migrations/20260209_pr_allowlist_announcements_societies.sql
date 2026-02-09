-- PR allowlist policies and announcements schema updates
-- Applies RLS policies to allow inserts/updates/deletes for specific emails
-- Adds new fields to announcements to support short/full details and scheduling

-- Helper function: check if current auth user is in PR allowlist
CREATE OR REPLACE FUNCTION public.is_pr_allowlisted()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(u.email) IN (
        'chadhaaarohi@gmail.com'
      )
  );
$$;

-- Announcements: add new columns if they don't exist
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS short_desc TEXT,
  ADD COLUMN IF NOT EXISTS full_details TEXT,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_info TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Announcements RLS: allow PR allowlisted users to write
CREATE POLICY "PR allowlist can insert announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (public.is_pr_allowlisted());

CREATE POLICY "PR allowlist can update announcements"
  ON public.announcements
  FOR UPDATE
  USING (public.is_pr_allowlisted())
  WITH CHECK (public.is_pr_allowlisted());

CREATE POLICY "PR allowlist can delete announcements"
  ON public.announcements
  FOR DELETE
  USING (public.is_pr_allowlisted());

-- Societies RLS: allow PR allowlisted users to manage societies
CREATE POLICY "PR allowlist can insert societies"
  ON public.societies
  FOR INSERT
  WITH CHECK (public.is_pr_allowlisted());

CREATE POLICY "PR allowlist can update societies"
  ON public.societies
  FOR UPDATE
  USING (public.is_pr_allowlisted())
  WITH CHECK (public.is_pr_allowlisted());

CREATE POLICY "PR allowlist can delete societies"
  ON public.societies
  FOR DELETE
  USING (public.is_pr_allowlisted());
