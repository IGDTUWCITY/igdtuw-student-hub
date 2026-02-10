-- Centralized PR heads allowlist in table form.
-- This lets admins update allowlisted users directly from Supabase table editor.

CREATE TABLE IF NOT EXISTS public.pr_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pr_heads_email_lower_chk CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS pr_heads_email_lower_idx
  ON public.pr_heads (lower(email));

ALTER TABLE public.pr_heads ENABLE ROW LEVEL SECURITY;

-- Seed current PR heads (idempotent).
INSERT INTO public.pr_heads (email, is_active)
VALUES
  ('chadhaaarohi@gmail.com', true),
  ('joysa078btcseai23@igdtuw.ac.in', true)
ON CONFLICT DO NOTHING;

UPDATE public.pr_heads
SET is_active = true
WHERE email IN ('chadhaaarohi@gmail.com', 'joysa078btcseai23@igdtuw.ac.in');

-- Use table-backed allowlist for RLS checks.
CREATE OR REPLACE FUNCTION public.is_pr_allowlisted()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pr_heads p
    WHERE p.is_active = true
      AND lower(p.email) = lower(COALESCE(auth.jwt()->>'email', ''))
  );
$$;

-- Tighten societies writes: do not allow all authenticated users.
DROP POLICY IF EXISTS "Authenticated users can insert societies" ON public.societies;
DROP POLICY IF EXISTS "Authenticated users can update societies" ON public.societies;
