-- Create enum type for opportunity types
CREATE TYPE opportunity_type AS ENUM ('internship', 'scholarship', 'hackathon', 'competition', 'workshop');

-- Create opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type opportunity_type NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  is_remote BOOLEAN DEFAULT false,
  stipend TEXT,
  required_skills TEXT[] DEFAULT '{}',
  apply_link TEXT,
  external_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on deadline for faster queries
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);

-- Create index on opportunity_type for filtering
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);

-- Create index on external_id for duplicate checking
CREATE INDEX idx_opportunities_external_id ON opportunities(external_id);

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read opportunities
CREATE POLICY "Opportunities are viewable by everyone"
  ON opportunities
  FOR SELECT
  USING (true);

-- Create policy: Only authenticated users can insert (for backend service)
CREATE POLICY "Authenticated users can insert opportunities"
  ON opportunities
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create saved_opportunities table (for users to bookmark opportunities)
CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_saved_opportunities_user_id ON saved_opportunities(user_id);

-- Enable RLS on saved_opportunities
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved opportunities
CREATE POLICY "Users can view their own saved opportunities"
  ON saved_opportunities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can save opportunities
CREATE POLICY "Users can save opportunities"
  ON saved_opportunities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their saved opportunities
CREATE POLICY "Users can delete their saved opportunities"
  ON saved_opportunities
  FOR DELETE
  USING (auth.uid() = user_id);
