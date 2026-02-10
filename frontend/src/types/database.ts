// Custom types for IGDTUW City 2.0

export type BranchType = 'CSE' | 'IT' | 'ECE' | 'EEE' | 'MAE' | 'AI_ML' | 'AI_DS';
export type YearType = '1st' | '2nd' | '3rd' | '4th';
export type OpportunityType = 'hackathon' | 'internship' | 'scholarship' | 'competition' | 'workshop' | 'research_conference';
export type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  branch?: BranchType;
  year?: YearType;
  current_semester?: number;
  enrollment_number?: string;
  skills: string[];
  interests: string[];
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  user_id: string;
  semester_number: number;
  sgpa?: number;
  total_credits: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  semester_id: string;
  user_id: string;
  subject_name: string;
  credits: number;
  grade_points?: number;
  grade?: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  opportunity_type: OpportunityType;
  organization?: string;
  location?: string;
  is_remote: boolean;
  deadline?: string | null;
  start_date?: string;
  end_date?: string;
  stipend?: string;
  eligibility_years: YearType[];
  eligibility_branches: BranchType[];
  required_skills: string[];
  apply_link?: string;
  source_url?: string;
  is_featured: boolean;
  created_at: string;
}

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  reminder_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity;
}

export interface Society {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  category?: string;
  instagram_url?: string;
  linkedin_url?: string;
  created_by?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  society_id?: string;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  event_date?: string;
  event_location?: string;
  created_by?: string;
  created_at: string;
  society?: Society;
}

export interface UserEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: string;
  source_announcement_id?: string;
  source_opportunity_id?: string;
  reminder_enabled: boolean;
  created_at: string;
}

// Grade mapping for IGDTUW
export const GRADE_POINTS: Record<string, number> = {
  'A+': 10,
  'A': 9,
  'B+': 8,
  'B': 7,
  'C+': 6,
  'C': 5,
  'F': 0,
};

export const GRADES = Object.keys(GRADE_POINTS);

export const BRANCHES: { value: BranchType; label: string }[] = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'ECE', label: 'Electronics & Communication' },
  { value: 'EEE', label: 'Electrical & Electronics' },
  { value: 'MAE', label: 'Mechanical & Automation' },
  { value: 'AI_ML', label: 'AI & Machine Learning' },
  { value: 'AI_DS', label: 'AI & Data Science' },
];

export const YEARS: { value: YearType; label: string }[] = [
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' },
];
