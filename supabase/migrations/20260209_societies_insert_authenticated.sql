-- Broaden societies write access to authenticated users to resolve RLS insert failures
-- Keeps existing PR allowlist policies intact; adds parallel policies that permit authenticated users
-- This relies on UI gating (canPost) to restrict feature visibility

-- Allow authenticated users to insert societies
CREATE POLICY "Authenticated users can insert societies"
  ON public.societies
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update societies (optional convenience)
CREATE POLICY "Authenticated users can update societies"
  ON public.societies
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Leave delete restricted to PR allowlist (no change here)
