-- IGDTUW City 2.0 Database Schema

-- =============================================
-- 1. ENUMS FOR STANDARDIZED VALUES
-- =============================================

-- Branch enum for IGDTUW programs
CREATE TYPE public.branch_type AS ENUM (
  'CSE', 'IT', 'ECE', 'EEE', 'MAE', 'AI_ML', 'AI_DS'
);

-- Year enum
CREATE TYPE public.year_type AS ENUM (
  '1st', '2nd', '3rd', '4th'
);

-- Opportunity type enum
CREATE TYPE public.opportunity_type AS ENUM (
  'hackathon', 'internship', 'scholarship', 'competition', 'workshop'
);

-- Application status enum
CREATE TYPE public.application_status AS ENUM (
  'saved', 'applied', 'interviewing', 'accepted', 'rejected'
);

-- =============================================
-- 2. PROFILES TABLE (Core student data)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  branch branch_type,
  year year_type,
  current_semester INTEGER CHECK (current_semester >= 1 AND current_semester <= 8),
  enrollment_number TEXT UNIQUE,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- 3. SEMESTERS TABLE (Academic records)
-- =============================================

CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 8),
  sgpa DECIMAL(4,2) CHECK (sgpa >= 0 AND sgpa <= 10),
  total_credits INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, semester_number)
);

-- Enable RLS
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

-- Semester policies
CREATE POLICY "Users can view own semesters"
  ON public.semesters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own semesters"
  ON public.semesters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own semesters"
  ON public.semesters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own semesters"
  ON public.semesters FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 4. SUBJECTS TABLE (Subject grades per semester)
-- =============================================

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  grade_points DECIMAL(3,1) CHECK (grade_points >= 0 AND grade_points <= 10),
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Subject policies
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 5. OPPORTUNITIES TABLE (Hackathons, Internships)
-- =============================================

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type opportunity_type NOT NULL,
  organization TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  stipend TEXT,
  eligibility_years year_type[] DEFAULT '{}',
  eligibility_branches branch_type[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  apply_link TEXT,
  source_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (publicly readable, admin writeable)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opportunities are publicly readable"
  ON public.opportunities FOR SELECT
  USING (true);

-- =============================================
-- 6. SAVED OPPORTUNITIES TABLE (User-specific)
-- =============================================

CREATE TABLE public.saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'saved',
  reminder_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- Enable RLS
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved opportunities"
  ON public.saved_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved opportunities"
  ON public.saved_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved opportunities"
  ON public.saved_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved opportunities"
  ON public.saved_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 7. SOCIETIES TABLE
-- =============================================

CREATE TABLE public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  category TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (publicly readable)
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Societies are publicly readable"
  ON public.societies FOR SELECT
  USING (true);

-- =============================================
-- 8. ANNOUNCEMENTS TABLE
-- =============================================

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  event_date TIMESTAMPTZ,
  event_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (publicly readable)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements are publicly readable"
  ON public.announcements FOR SELECT
  USING (true);

-- =============================================
-- 9. USER CALENDAR EVENTS TABLE
-- =============================================

CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'personal',
  source_announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  source_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  reminder_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.user_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.user_events FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Function to calculate CGPA from all semesters
CREATE OR REPLACE FUNCTION public.calculate_cgpa(p_user_id UUID)
RETURNS DECIMAL(4,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_weighted_points DECIMAL;
  total_credits INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(s.sgpa * s.total_credits), 0),
    COALESCE(SUM(s.total_credits), 0)
  INTO total_weighted_points, total_credits
  FROM public.semesters s
  WHERE s.user_id = p_user_id AND s.is_completed = true;
  
  IF total_credits = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(total_weighted_points / total_credits, 2);
END;
$$;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semesters_updated_at
  BEFORE UPDATE ON public.semesters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_opportunities_updated_at
  BEFORE UPDATE ON public.saved_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();