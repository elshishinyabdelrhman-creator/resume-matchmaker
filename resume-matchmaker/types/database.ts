/**
 * Replace with generated types from the Supabase CLI:
 * `npx supabase gen types typescript --project-id <id> > types/database.ts`
 * Until then, tables are loosely typed via this placeholder.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          parsed_text: string | null;
          structured_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          parsed_text?: string | null;
          structured_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          parsed_text?: string | null;
          structured_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          title: string;
          description: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          title: string;
          description?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          title?: string;
          description?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          resume_id: string | null;
          company: string;
          role_title: string;
          /** Canonical role label (synced with role_title via DB trigger). */
          job_title: string;
          job_description: string | null;
          tailored_resume: string | null;
          ats_score: number | null;
          keyword_gaps: Json;
          source_url: string | null;
          status: string;
          notes: string | null;
          strengths: Json;
          improvements: Json;
          applied_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          resume_id?: string | null;
          company: string;
          role_title: string;
          job_title?: string;
          job_description?: string | null;
          tailored_resume?: string | null;
          ats_score?: number | null;
          keyword_gaps?: Json;
          source_url?: string | null;
          status?: string;
          notes?: string | null;
          strengths?: Json;
          improvements?: Json;
          applied_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          resume_id?: string | null;
          company?: string;
          role_title?: string;
          job_title?: string;
          job_description?: string | null;
          tailored_resume?: string | null;
          ats_score?: number | null;
          keyword_gaps?: Json;
          source_url?: string | null;
          status?: string;
          notes?: string | null;
          strengths?: Json;
          improvements?: Json;
          applied_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ats_scores: {
        Row: {
          id: string;
          application_id: string | null;
          resume_id: string | null;
          overall_score: number;
          breakdown: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id?: string | null;
          resume_id?: string | null;
          overall_score: number;
          breakdown?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string | null;
          resume_id?: string | null;
          overall_score?: number;
          breakdown?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      tailor_runs: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          resume_id: string | null;
          input_jd_excerpt: string | null;
          suggestions: Json;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id?: string | null;
          resume_id?: string | null;
          input_jd_excerpt?: string | null;
          suggestions?: Json;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string | null;
          resume_id?: string | null;
          input_jd_excerpt?: string | null;
          suggestions?: Json;
          model?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
