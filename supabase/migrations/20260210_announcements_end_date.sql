-- Support multi-day announcements by storing an explicit end date.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS end_date DATE;
