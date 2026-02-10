-- Keep allowlist function in sync with table-backed PR head management.
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
