-- More reliable RLS for societies: use auth.uid() to detect signed-in users
-- Supabase best practice: auth.uid() IS NOT NULL for "authenticated"

CREATE POLICY "Signed-in users can insert societies"
  ON public.societies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can update societies"
  ON public.societies
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
