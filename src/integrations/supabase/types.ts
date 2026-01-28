export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          event_date: string | null
          event_location: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          society_id: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          society_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          society_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          apply_link: string | null
          created_at: string
          deadline: string | null
          description: string | null
          eligibility_branches:
            | Database["public"]["Enums"]["branch_type"][]
            | null
          eligibility_years: Database["public"]["Enums"]["year_type"][] | null
          end_date: string | null
          id: string
          is_featured: boolean | null
          is_remote: boolean | null
          location: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          organization: string | null
          required_skills: string[] | null
          source_url: string | null
          start_date: string | null
          stipend: string | null
          title: string
        }
        Insert: {
          apply_link?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_branches?:
            | Database["public"]["Enums"]["branch_type"][]
            | null
          eligibility_years?: Database["public"]["Enums"]["year_type"][] | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          organization?: string | null
          required_skills?: string[] | null
          source_url?: string | null
          start_date?: string | null
          stipend?: string | null
          title: string
        }
        Update: {
          apply_link?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_branches?:
            | Database["public"]["Enums"]["branch_type"][]
            | null
          eligibility_years?: Database["public"]["Enums"]["year_type"][] | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          organization?: string | null
          required_skills?: string[] | null
          source_url?: string | null
          start_date?: string | null
          stipend?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: Database["public"]["Enums"]["branch_type"] | null
          created_at: string
          current_semester: number | null
          email: string
          enrollment_number: string | null
          full_name: string
          github_url: string | null
          id: string
          interests: string[] | null
          linkedin_url: string | null
          skills: string[] | null
          updated_at: string
          year: Database["public"]["Enums"]["year_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          created_at?: string
          current_semester?: number | null
          email: string
          enrollment_number?: string | null
          full_name: string
          github_url?: string | null
          id: string
          interests?: string[] | null
          linkedin_url?: string | null
          skills?: string[] | null
          updated_at?: string
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          created_at?: string
          current_semester?: number | null
          email?: string
          enrollment_number?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          skills?: string[] | null
          updated_at?: string
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          opportunity_id: string
          reminder_date: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id: string
          reminder_date?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          reminder_date?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          semester_number: number
          sgpa: number | null
          total_credits: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          semester_number: number
          sgpa?: number | null
          total_credits?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          semester_number?: number
          sgpa?: number | null
          total_credits?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      societies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          credits: number
          grade: string | null
          grade_points: number | null
          id: string
          semester_id: string
          subject_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          grade?: string | null
          grade_points?: number | null
          id?: string
          semester_id: string
          subject_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          grade?: string | null
          grade_points?: number | null
          id?: string
          semester_id?: string
          subject_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          reminder_enabled: boolean | null
          source_announcement_id: string | null
          source_opportunity_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          reminder_enabled?: boolean | null
          source_announcement_id?: string | null
          source_opportunity_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          reminder_enabled?: boolean | null
          source_announcement_id?: string | null
          source_opportunity_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_source_announcement_id_fkey"
            columns: ["source_announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_source_opportunity_id_fkey"
            columns: ["source_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cgpa: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "interviewing"
        | "accepted"
        | "rejected"
      branch_type: "CSE" | "IT" | "ECE" | "EEE" | "MAE" | "AI_ML" | "AI_DS"
      opportunity_type:
        | "hackathon"
        | "internship"
        | "scholarship"
        | "competition"
        | "workshop"
      year_type: "1st" | "2nd" | "3rd" | "4th"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "saved",
        "applied",
        "interviewing",
        "accepted",
        "rejected",
      ],
      branch_type: ["CSE", "IT", "ECE", "EEE", "MAE", "AI_ML", "AI_DS"],
      opportunity_type: [
        "hackathon",
        "internship",
        "scholarship",
        "competition",
        "workshop",
      ],
      year_type: ["1st", "2nd", "3rd", "4th"],
    },
  },
} as const
