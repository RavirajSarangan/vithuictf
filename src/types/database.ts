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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_id: string
          description: string
          icon: string
          id: string
          student_id: string
          title: string
          unlocked_at: string
        }
        Insert: {
          badge_id: string
          description: string
          icon: string
          id?: string
          student_id: string
          title: string
          unlocked_at?: string
        }
        Update: {
          badge_id?: string
          description?: string
          icon?: string
          id?: string
          student_id?: string
          title?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          student_id: string
          title: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          student_id: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_definitions: {
        Row: {
          description: string
          icon: string
          id: string
          points: number
          title: string
        }
        Insert: {
          description: string
          icon: string
          id: string
          points?: number
          title: string
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sessions: {
        Row: {
          category_id: string
          course_id: string | null
          created_at: string
          day_of_week: number | null
          duration_minutes: number
          end_time: string
          id: string
          mode: Database["public"]["Enums"]["session_mode"]
          room: string
          session_date: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          start_time: string
          teacher_name: string
          title: string
        }
        Insert: {
          category_id: string
          course_id?: string | null
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number
          end_time: string
          id?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          room?: string
          session_date?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          start_time: string
          teacher_name?: string
          title: string
        }
        Update: {
          category_id?: string
          course_id?: string | null
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number
          end_time?: string
          id?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          room?: string
          session_date?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          start_time?: string
          teacher_name?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subject_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_batches: {
        Row: {
          created_at: string
          created_by: string | null
          error_log: Json
          id: string
          issue_date: string
          name: string
          status: string
          success_count: number
          template_id: string | null
          total_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_log?: Json
          id?: string
          issue_date?: string
          name: string
          status?: string
          success_count?: number
          template_id?: string | null
          total_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_log?: Json
          id?: string
          issue_date?: string
          name?: string
          status?: string
          success_count?: number
          template_id?: string | null
          total_count?: number
        }
        Relationships: []
      }
      certificate_sequences: {
        Row: {
          last_number: number
          prefix: string
        }
        Insert: {
          last_number?: number
          prefix: string
        }
        Update: {
          last_number?: number
          prefix?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string
          field_config: Json
          id: string
          id_padding: number
          id_prefix: string
          image_url: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_config?: Json
          id?: string
          id_padding?: number
          id_prefix?: string
          image_url: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_config?: Json
          id?: string
          id_padding?: number
          id_prefix?: string
          image_url?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          batch_id: string | null
          certificate_number: string | null
          course_id: string | null
          course_name: string
          delivered_at: string | null
          delivery_status: string
          email_sent_at: string | null
          id: string
          image_path: string | null
          issued_at: string
          recipient_email: string | null
          recipient_phone: string | null
          student_id: string | null
          student_name: string
          verify_code: string | null
        }
        Insert: {
          batch_id?: string | null
          certificate_number?: string | null
          course_id?: string | null
          course_name: string
          delivered_at?: string | null
          delivery_status?: string
          email_sent_at?: string | null
          id?: string
          image_path?: string | null
          issued_at?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          student_id?: string | null
          student_name: string
          verify_code?: string | null
        }
        Update: {
          batch_id?: string | null
          certificate_number?: string | null
          course_id?: string | null
          course_name?: string
          delivered_at?: string | null
          delivery_status?: string
          email_sent_at?: string | null
          id?: string
          image_path?: string | null
          issued_at?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          student_id?: string | null
          student_name?: string
          verify_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_programs: {
        Row: {
          badge: string
          created_at: string
          description: string
          description_ta: string
          icon: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          title: string
          title_ta: string
        }
        Insert: {
          badge?: string
          created_at?: string
          description?: string
          description_ta?: string
          icon?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title: string
          title_ta?: string
        }
        Update: {
          badge?: string
          created_at?: string
          description?: string
          description_ta?: string
          icon?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          title_ta?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string
          description_ta: string
          id: string
          is_active: boolean
          location: string
          logo_url: string
          name: string
          sort_order: number
          website_url: string
        }
        Insert: {
          created_at?: string
          description?: string
          description_ta?: string
          id?: string
          is_active?: boolean
          location?: string
          logo_url?: string
          name: string
          sort_order?: number
          website_url?: string
        }
        Update: {
          created_at?: string
          description?: string
          description_ta?: string
          id?: string
          is_active?: boolean
          location?: string
          logo_url?: string
          name?: string
          sort_order?: number
          website_url?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          cover_image_url: string
          created_at: string
          description: string
          duration_months: number | null
          id: string
          level: Database["public"]["Enums"]["course_level"]
          name: string
          slug: string | null
          student_count: number
          teacher_id: string | null
          teacher_name: string
        }
        Insert: {
          category?: string
          cover_image_url?: string
          created_at?: string
          description?: string
          duration_months?: number | null
          id?: string
          level: Database["public"]["Enums"]["course_level"]
          name: string
          slug?: string | null
          student_count?: number
          teacher_id?: string | null
          teacher_name?: string
        }
        Update: {
          category?: string
          cover_image_url?: string
          created_at?: string
          description?: string
          duration_months?: number | null
          id?: string
          level?: Database["public"]["Enums"]["course_level"]
          name?: string
          slug?: string | null
          student_count?: number
          teacher_id?: string | null
          teacher_name?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          course_id: string
          exam_date: string
          id: string
          subjects: string[]
          title: string
        }
        Insert: {
          course_id: string
          exam_date: string
          id?: string
          subjects?: string[]
          title: string
        }
        Update: {
          course_id?: string
          exam_date?: string
          id?: string
          subjects?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      featured_rankings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rank_type: string
          score: number
          sort_order: number
          student_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rank_type: string
          score?: number
          sort_order?: number
          student_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rank_type?: string
          score?: number
          sort_order?: number
          student_name?: string
        }
        Relationships: []
      }
      marketing_announcements: {
        Row: {
          body: string
          content_type: string
          created_at: string
          cta_label: string
          cta_url: string
          display_style: string
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          priority: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          content_type?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          display_style?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          content_type?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          display_style?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_about: {
        Row: {
          bio: string
          bio_ta: string
          credentials: string
          cta_label: string
          cta_url: string
          highlight_experience_years: number
          highlight_students: number
          id: number
          name: string
          photo_url: string
          title: string
          title_ta: string
        }
        Insert: {
          bio?: string
          bio_ta?: string
          credentials?: string
          cta_label?: string
          cta_url?: string
          highlight_experience_years?: number
          highlight_students?: number
          id?: number
          name?: string
          photo_url?: string
          title?: string
          title_ta?: string
        }
        Update: {
          bio?: string
          bio_ta?: string
          credentials?: string
          cta_label?: string
          cta_url?: string
          highlight_experience_years?: number
          highlight_students?: number
          id?: number
          name?: string
          photo_url?: string
          title?: string
          title_ta?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          course_id: string
          id: string
          performance: number
          points: number
          rank: number
          student_id: string
          student_name: string
        }
        Insert: {
          course_id: string
          id?: string
          performance?: number
          points?: number
          rank?: number
          student_id: string
          student_name: string
        }
        Update: {
          course_id?: string
          id?: string
          performance?: number
          points?: number
          rank?: number
          student_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      network_stats: {
        Row: {
          cta_label: string
          cta_label_ta: string
          cta_url: string
          districts_covered: number
          headline: string
          headline_ta: string
          id: number
          paper_centers_count: number
          papers_written: number
          pass_rate: number
          subheadline: string
          subheadline_ta: string
        }
        Insert: {
          cta_label?: string
          cta_label_ta?: string
          cta_url?: string
          districts_covered?: number
          headline?: string
          headline_ta?: string
          id?: number
          paper_centers_count?: number
          papers_written?: number
          pass_rate?: number
          subheadline?: string
          subheadline_ta?: string
        }
        Update: {
          cta_label?: string
          cta_label_ta?: string
          cta_url?: string
          districts_covered?: number
          headline?: string
          headline_ta?: string
          id?: number
          paper_centers_count?: number
          papers_written?: number
          pass_rate?: number
          subheadline?: string
          subheadline_ta?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_centers: {
        Row: {
          address: string
          created_at: string
          district: string
          id: string
          is_active: boolean
          map_url: string
          map_x: number | null
          map_y: number | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          address?: string
          created_at?: string
          district?: string
          id?: string
          is_active?: boolean
          map_url?: string
          map_x?: number | null
          map_y?: number | null
          name: string
          slug?: string
          sort_order?: number
        }
        Update: {
          address?: string
          created_at?: string
          district?: string
          id?: string
          is_active?: boolean
          map_url?: string
          map_x?: number | null
          map_y?: number | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          display_name: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          display_name: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          display_name?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          method: string
          payment_date: string
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          student_name: string
        }
        Insert: {
          amount: number
          id?: string
          method?: string
          payment_date?: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          student_name: string
        }
        Update: {
          amount?: number
          id?: string
          method?: string
          payment_date?: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          course_id: string
          course_name: string
          created_at: string
          description: string
          id: string
          popular: boolean
          storage_path: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          view_only: boolean
          views: number
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          course_id: string
          course_name?: string
          created_at?: string
          description?: string
          id?: string
          popular?: boolean
          storage_path: string
          title: string
          type?: Database["public"]["Enums"]["resource_type"]
          view_only?: boolean
          views?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          course_id?: string
          course_name?: string
          created_at?: string
          description?: string
          id?: string
          popular?: boolean
          storage_path?: string
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          view_only?: boolean
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          exam_id: string | null
          exam_title: string
          grade: string
          id: string
          marks: number
          max_marks: number
          rank: number
          result_date: string
          student_id: string
          subject: string
          term: string
        }
        Insert: {
          exam_id?: string | null
          exam_title: string
          grade: string
          id?: string
          marks: number
          max_marks?: number
          rank?: number
          result_date: string
          student_id: string
          subject: string
          term: string
        }
        Update: {
          exam_id?: string | null
          exam_title?: string
          grade?: string
          id?: string
          marks?: number
          max_marks?: number
          rank?: number
          result_date?: string
          student_id?: string
          subject?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      site_stats: {
        Row: {
          certified_teachers: number
          courses: number
          id: number
          resources: number
          satisfaction: number
          students: number
          success_rate: number
          years_experience: number
        }
        Insert: {
          certified_teachers?: number
          courses?: number
          id?: number
          resources?: number
          satisfaction?: number
          students?: number
          success_rate?: number
          years_experience?: number
        }
        Update: {
          certified_teachers?: number
          courses?: number
          id?: number
          resources?: number
          satisfaction?: number
          students?: number
          success_rate?: number
          years_experience?: number
        }
        Relationships: []
      }
      students: {
        Row: {
          bio: string
          card_public: boolean
          course_id: string | null
          course_name: string
          display_name: string
          email: string
          grade: string
          id: string
          index_number: string | null
          nic_number: string | null
          notify_email: boolean
          exam_year: string | null
          ict_grade: string | null
          onboarding_completed_at: string | null
          onboarding_steps: Json
          performance: number
          phone: string | null
          photo_url: string | null
          points: number
          rank: number
          social_links: Json
          streak: number
          student_id: string
          user_id: string
          username: string | null
          active: boolean
          disabled_at: string | null
        }
        Insert: {
          bio?: string
          card_public?: boolean
          course_id?: string | null
          course_name?: string
          display_name: string
          email: string
          grade?: string
          id?: string
          index_number?: string | null
          nic_number?: string | null
          notify_email?: boolean
          exam_year?: string | null
          ict_grade?: string | null
          onboarding_completed_at?: string | null
          onboarding_steps?: Json
          performance?: number
          phone?: string | null
          photo_url?: string | null
          points?: number
          rank?: number
          social_links?: Json
          streak?: number
          student_id: string
          user_id: string
          username?: string | null
          active?: boolean
          disabled_at?: string | null
        }
        Update: {
          bio?: string
          card_public?: boolean
          course_id?: string | null
          course_name?: string
          display_name?: string
          email?: string
          grade?: string
          id?: string
          index_number?: string | null
          nic_number?: string | null
          notify_email?: boolean
          exam_year?: string | null
          ict_grade?: string | null
          onboarding_completed_at?: string | null
          onboarding_steps?: Json
          performance?: number
          phone?: string | null
          photo_url?: string | null
          points?: number
          rank?: number
          social_links?: Json
          streak?: number
          student_id?: string
          user_id?: string
          username?: string | null
          active?: boolean
          disabled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_categories: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          achievement: string
          course: string
          id: string
          name: string
          photo: string
          review: string
        }
        Insert: {
          achievement: string
          course: string
          id?: string
          name: string
          photo?: string
          review: string
        }
        Update: {
          achievement?: string
          course?: string
          id?: string
          name?: string
          photo?: string
          review?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          active: boolean | null
          certified: boolean
          course_ids: string[] | null
          display_name: string
          email: string
          id: string
          staff_username: string | null
          subjects: string[]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          certified?: boolean
          course_ids?: string[] | null
          display_name: string
          email: string
          id?: string
          staff_username?: string | null
          subjects?: string[]
          user_id: string
        }
        Update: {
          active?: boolean | null
          certified?: boolean
          course_ids?: string[] | null
          display_name?: string
          email?: string
          id?: string
          staff_username?: string | null
          subjects?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_batches: {
        Row: {
          id: string
          course_id: string
          name: string
          batch_code: string
          start_date: string
          end_date: string
          start_time: string
          end_time: string
          class_days: string[]
          total_classes: number
          active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          batch_code: string
          start_date: string
          end_date: string
          start_time?: string
          end_time?: string
          class_days?: string[]
          total_classes?: number
          active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          batch_code?: string
          start_date?: string
          end_date?: string
          start_time?: string
          end_time?: string
          class_days?: string[]
          total_classes?: number
          active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      batch_enrollments: {
        Row: {
          id: string
          batch_id: string
          student_id: string
          enrollment_code: string
          joined_at: string
          active: boolean
        }
        Insert: {
          id?: string
          batch_id: string
          student_id: string
          enrollment_code: string
          joined_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          batch_id?: string
          student_id?: string
          enrollment_code?: string
          joined_at?: string
          active?: boolean
        }
        Relationships: []
      }
      class_sessions: {
        Row: {
          id: string
          batch_id: string
          session_number: number
          scheduled_date: string
          start_time: string
          end_time: string
          status: Database["public"]["Enums"]["class_session_status"]
        }
        Insert: {
          id?: string
          batch_id: string
          session_number: number
          scheduled_date: string
          start_time: string
          end_time: string
          status?: Database["public"]["Enums"]["class_session_status"]
        }
        Update: {
          id?: string
          batch_id?: string
          session_number?: number
          scheduled_date?: string
          start_time?: string
          end_time?: string
          status?: Database["public"]["Enums"]["class_session_status"]
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          marked_by: string | null
          marked_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          marked_by?: string | null
          marked_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          marked_by?: string | null
          marked_at?: string
        }
        Relationships: []
      }
      pass_paper_folders: {
        Row: {
          id: string
          parent_id: string | null
          title: string
          slug: string
          description: string
          icon_key: string
          accent_color: string
          layout: Database["public"]["Enums"]["pass_paper_layout"]
          sort_order: number
          published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          title: string
          slug: string
          description?: string
          icon_key?: string
          accent_color?: string
          layout?: Database["public"]["Enums"]["pass_paper_layout"]
          sort_order?: number
          published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          title?: string
          slug?: string
          description?: string
          icon_key?: string
          accent_color?: string
          layout?: Database["public"]["Enums"]["pass_paper_layout"]
          sort_order?: number
          published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pass_paper_items: {
        Row: {
          id: string
          folder_id: string
          title: string
          drive_url: string
          year: number | null
          medium: Database["public"]["Enums"]["pass_paper_medium"] | null
          exam_type: Database["public"]["Enums"]["pass_paper_exam_type"]
          sort_order: number
          published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          title: string
          drive_url: string
          year?: number | null
          medium?: Database["public"]["Enums"]["pass_paper_medium"] | null
          exam_type?: Database["public"]["Enums"]["pass_paper_exam_type"]
          sort_order?: number
          published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          title?: string
          drive_url?: string
          year?: number | null
          medium?: Database["public"]["Enums"]["pass_paper_medium"] | null
          exam_type?: Database["public"]["Enums"]["pass_paper_exam_type"]
          sort_order?: number
          published?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_parent_of: { Args: { p_student_id: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      next_certificate_number: {
        Args: { p_padding?: number; p_prefix: string }
        Returns: string
      }
      own_student_id: { Args: never; Returns: string }
      student_enrolled_course_id: { Args: never; Returns: string }
    }
    Enums: {
      course_level: "OL" | "AL" | "University" | "Professional"
      notification_type: "result" | "announcement" | "achievement"
      payment_status: "paid" | "pending" | "overdue"
      resource_category:
        | "notes"
        | "past_papers"
        | "videos"
        | "assignments"
        | "study_guides"
      resource_type: "pdf" | "video"
      attendance_status: "present" | "absent" | "late"
      class_session_status: "scheduled" | "completed" | "cancelled"
      pass_paper_layout: "grid" | "list" | "folder"
      pass_paper_medium: "sinhala" | "tamil" | "english"
      pass_paper_exam_type: "ol" | "al" | "scholarship" | "other"
      session_mode: "physical" | "online"
      session_type: "recurring" | "one_off"
      user_role: "student" | "parent" | "teacher" | "admin" | "super_admin" | "content_manager" | "paper_center_staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      course_level: ["OL", "AL", "University", "Professional"],
      notification_type: ["result", "announcement", "achievement"],
      payment_status: ["paid", "pending", "overdue"],
      resource_category: [
        "notes",
        "past_papers",
        "videos",
        "assignments",
        "study_guides",
      ],
      resource_type: ["pdf", "video"],
      session_mode: ["physical", "online"],
      session_type: ["recurring", "one_off"],
      user_role: ["student", "parent", "teacher", "admin", "super_admin", "content_manager", "paper_center_staff"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
