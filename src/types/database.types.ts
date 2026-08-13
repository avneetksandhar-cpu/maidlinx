export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          role: "customer" | "professional" | "cleaner" | "admin";
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
          stripe_customer_id: string | null;
          stripe_connect_id: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          role?: "customer" | "professional" | "cleaner" | "admin";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          stripe_connect_id?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string | null;
          role?: "customer" | "professional" | "cleaner" | "admin";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          stripe_connect_id?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          default_address_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          default_address_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          default_address_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaners: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          years_experience: number | null;
          service_radius_km: number;
          is_verified: boolean;
          is_active: boolean;
          approved: boolean;
          rating_average: number;
          rating_count: number;
          has_vehicle: boolean;
          qualifications: string[];
          preferences: Json;
          travel_radius_km: number | null;
          completed_jobs: number;
          cancellation_rate: number;
          on_time_rate: number;
          stripe_connect_id: string | null;
          onboarding_status:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist: Json;
          is_online: boolean;
          last_online_at: string | null;
          stripe_connect_status: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          market_id: string | null;
          languages: string[];
          transportation: string | null;
          agreements_accepted_at: string | null;
          onboarding_submitted_at: string | null;
          onboarding_reviewed_at: string | null;
          rejection_reason: string | null;

          platform_stage: string;
          identity_status: string;
          identity_provider: string | null;
          identity_external_ref: string | null;
          identity_reviewed_at: string | null;
          identity_reviewed_by: string | null;
          background_status: string;
          background_provider: string | null;
          background_external_ref: string | null;
          background_reviewed_at: string | null;
          background_reviewed_by: string | null;
          phone_verified_at: string | null;
          email_verified_at: string | null;
          training_completed_at: string | null;
          assessment_passed_at: string | null;
          activated_at: string | null;
          trust_score: number;
          reliability_score: number;
          serious_flag_count: number;
          requires_admin_review: boolean;
          application: Json;
          application_submitted_at: string | null;
          maidlinx_verified: boolean;
          verified_at: string | null;          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          years_experience?: number | null;
          service_radius_km?: number;
          is_verified?: boolean;
          is_active?: boolean;
          approved?: boolean;
          rating_average?: number;
          rating_count?: number;
          has_vehicle?: boolean;
          qualifications?: string[];
          preferences?: Json;
          travel_radius_km?: number | null;
          completed_jobs?: number;
          cancellation_rate?: number;
          on_time_rate?: number;
          stripe_connect_id?: string | null;
          onboarding_status?:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist?: Json;
          is_online?: boolean;
          last_online_at?: string | null;
          stripe_connect_status?: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          market_id?: string | null;
          languages?: string[];
          transportation?: string | null;
          agreements_accepted_at?: string | null;
          onboarding_submitted_at?: string | null;
          onboarding_reviewed_at?: string | null;
          rejection_reason?: string | null;

          platform_stage?: string;
          identity_status?: string;
          identity_provider?: string | null;
          identity_external_ref?: string | null;
          identity_reviewed_at?: string | null;
          identity_reviewed_by?: string | null;
          background_status?: string;
          background_provider?: string | null;
          background_external_ref?: string | null;
          background_reviewed_at?: string | null;
          background_reviewed_by?: string | null;
          phone_verified_at?: string | null;
          email_verified_at?: string | null;
          training_completed_at?: string | null;
          assessment_passed_at?: string | null;
          activated_at?: string | null;
          trust_score?: number;
          reliability_score?: number;
          serious_flag_count?: number;
          requires_admin_review?: boolean;
          application?: Json;
          application_submitted_at?: string | null;
          maidlinx_verified?: boolean;
          verified_at?: string | null;          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          years_experience?: number | null;
          service_radius_km?: number;
          is_verified?: boolean;
          is_active?: boolean;
          approved?: boolean;
          rating_average?: number;
          rating_count?: number;
          has_vehicle?: boolean;
          qualifications?: string[];
          preferences?: Json;
          travel_radius_km?: number | null;
          completed_jobs?: number;
          cancellation_rate?: number;
          on_time_rate?: number;
          stripe_connect_id?: string | null;
          onboarding_status?:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist?: Json;
          is_online?: boolean;
          last_online_at?: string | null;
          stripe_connect_status?: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          market_id?: string | null;
          languages?: string[];
          transportation?: string | null;
          agreements_accepted_at?: string | null;
          onboarding_submitted_at?: string | null;
          onboarding_reviewed_at?: string | null;
          rejection_reason?: string | null;

          platform_stage?: string;
          identity_status?: string;
          identity_provider?: string | null;
          identity_external_ref?: string | null;
          identity_reviewed_at?: string | null;
          identity_reviewed_by?: string | null;
          background_status?: string;
          background_provider?: string | null;
          background_external_ref?: string | null;
          background_reviewed_at?: string | null;
          background_reviewed_by?: string | null;
          phone_verified_at?: string | null;
          email_verified_at?: string | null;
          training_completed_at?: string | null;
          assessment_passed_at?: string | null;
          activated_at?: string | null;
          trust_score?: number;
          reliability_score?: number;
          serious_flag_count?: number;
          requires_admin_review?: boolean;
          application?: Json;
          application_submitted_at?: string | null;
          maidlinx_verified?: boolean;
          verified_at?: string | null;          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      cleaner_approval_gates: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      academy_modules: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_training_progress: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_assessment_attempts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_trust_flags: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_platform_audit_log: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_live_locations: {
        Row: {
          booking_id: string;
          cleaner_id: string;
          lat: number;
          lng: number;
          accuracy: number | null;
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          cleaner_id: string;
          lat: number;
          lng: number;
          accuracy?: number | null;
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          cleaner_id?: string;
          lat?: number;
          lng?: number;
          accuracy?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaner_documents: {
        Row: {
          id: string;
          cleaner_id: string;
          doc_type: "id_front" | "id_back" | "selfie" | "work_auth" | "insurance" | "other";
          storage_path: string;
          file_name: string | null;
          mime_type: string | null;
          status: "uploaded" | "under_review" | "accepted" | "rejected";
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          doc_type: "id_front" | "id_back" | "selfie" | "work_auth" | "insurance" | "other";
          storage_path: string;
          file_name?: string | null;
          mime_type?: string | null;
          status?: "uploaded" | "under_review" | "accepted" | "rejected";
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          doc_type?: "id_front" | "id_back" | "selfie" | "work_auth" | "insurance" | "other";
          storage_path?: string;
          file_name?: string | null;
          mime_type?: string | null;
          status?: "uploaded" | "under_review" | "accepted" | "rejected";
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaner_unavailable_dates: {
        Row: {
          id: string;
          cleaner_id: string;
          unavailable_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          unavailable_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          unavailable_date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      booking_extras: {
        Row: {
          id: string;
          booking_id: string;
          extra_key: string;
          label: string | null;
          unit_price_cents: number;
          quantity: number;
          total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          extra_key: string;
          label?: string | null;
          unit_price_cents?: number;
          quantity?: number;
          total_cents?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          extra_key?: string;
          label?: string | null;
          unit_price_cents?: number;
          quantity?: number;
          total_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      cleaner_assignments: {
        Row: {
          id: string;
          booking_id: string;
          cleaner_id: string;
          assigned_by: string | null;
          source: Database["public"]["Enums"]["cleaner_assignment_source"];
          status: Database["public"]["Enums"]["cleaner_assignment_status"];
          note: string | null;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          cleaner_id: string;
          assigned_by?: string | null;
          source: Database["public"]["Enums"]["cleaner_assignment_source"];
          status?: Database["public"]["Enums"]["cleaner_assignment_status"];
          note?: string | null;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          cleaner_id?: string;
          assigned_by?: string | null;
          source?: Database["public"]["Enums"]["cleaner_assignment_source"];
          status?: Database["public"]["Enums"]["cleaner_assignment_status"];
          note?: string | null;
          created_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      /** @deprecated Use `users` — backward-compat view */
      profiles: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          role: "customer" | "professional" | "cleaner" | "admin";
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
          stripe_customer_id: string | null;
          stripe_connect_id: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string | null;
          role?: "customer" | "professional" | "cleaner" | "admin";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          stripe_connect_id?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          role?: "customer" | "professional" | "cleaner" | "admin";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          stripe_connect_id?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string | null;
          user_id: string | null;
          label: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          formatted_address: string | null;
          google_place_id: string | null;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          user_id?: string | null;
          label?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          formatted_address?: string | null;
          google_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          user_id?: string | null;
          label?: string | null;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          formatted_address?: string | null;
          google_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /** @deprecated Use `cleaners` — backward-compat view */
      professionals: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          years_experience: number | null;
          service_radius_km: number;
          is_verified: boolean;
          is_active: boolean;
          rating_average: number;
          rating_count: number;
          onboarding_status:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist: Json;
          is_online: boolean;
          last_online_at: string | null;
          stripe_connect_status: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          stripe_connect_id: string | null;
          market_id: string | null;
          languages: string[];
          transportation: string | null;
          agreements_accepted_at: string | null;
          onboarding_submitted_at: string | null;
          onboarding_reviewed_at: string | null;
          rejection_reason: string | null;

          platform_stage: string;
          identity_status: string;
          identity_provider: string | null;
          identity_external_ref: string | null;
          identity_reviewed_at: string | null;
          identity_reviewed_by: string | null;
          background_status: string;
          background_provider: string | null;
          background_external_ref: string | null;
          background_reviewed_at: string | null;
          background_reviewed_by: string | null;
          phone_verified_at: string | null;
          email_verified_at: string | null;
          training_completed_at: string | null;
          assessment_passed_at: string | null;
          activated_at: string | null;
          trust_score: number;
          reliability_score: number;
          serious_flag_count: number;
          requires_admin_review: boolean;
          application: Json;
          application_submitted_at: string | null;
          maidlinx_verified: boolean;
          verified_at: string | null;          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          years_experience?: number | null;
          service_radius_km?: number;
          is_verified?: boolean;
          is_active?: boolean;
          rating_average?: number;
          rating_count?: number;
          onboarding_status?:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist?: Json;
          is_online?: boolean;
          last_online_at?: string | null;
          stripe_connect_status?: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          stripe_connect_id?: string | null;
          market_id?: string | null;
          languages?: string[];
          transportation?: string | null;
          agreements_accepted_at?: string | null;
          onboarding_submitted_at?: string | null;
          onboarding_reviewed_at?: string | null;
          rejection_reason?: string | null;

          platform_stage?: string;
          identity_status?: string;
          identity_provider?: string | null;
          identity_external_ref?: string | null;
          identity_reviewed_at?: string | null;
          identity_reviewed_by?: string | null;
          background_status?: string;
          background_provider?: string | null;
          background_external_ref?: string | null;
          background_reviewed_at?: string | null;
          background_reviewed_by?: string | null;
          phone_verified_at?: string | null;
          email_verified_at?: string | null;
          training_completed_at?: string | null;
          assessment_passed_at?: string | null;
          activated_at?: string | null;
          trust_score?: number;
          reliability_score?: number;
          serious_flag_count?: number;
          requires_admin_review?: boolean;
          application?: Json;
          application_submitted_at?: string | null;
          maidlinx_verified?: boolean;
          verified_at?: string | null;          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          bio?: string | null;
          years_experience?: number | null;
          service_radius_km?: number;
          is_verified?: boolean;
          is_active?: boolean;
          rating_average?: number;
          rating_count?: number;
          onboarding_status?:
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "SUSPENDED";
          onboarding_checklist?: Json;
          is_online?: boolean;
          last_online_at?: string | null;
          stripe_connect_status?: "NOT_STARTED" | "PENDING" | "ENABLED" | "RESTRICTED";
          stripe_connect_id?: string | null;
          market_id?: string | null;
          languages?: string[];
          transportation?: string | null;
          agreements_accepted_at?: string | null;
          onboarding_submitted_at?: string | null;
          onboarding_reviewed_at?: string | null;
          rejection_reason?: string | null;
          platform_stage?: string;
          identity_status?: string;
          identity_provider?: string | null;
          identity_external_ref?: string | null;
          identity_reviewed_at?: string | null;
          identity_reviewed_by?: string | null;
          background_status?: string;
          background_provider?: string | null;
          background_external_ref?: string | null;
          background_reviewed_at?: string | null;
          background_reviewed_by?: string | null;
          phone_verified_at?: string | null;
          email_verified_at?: string | null;
          training_completed_at?: string | null;
          assessment_passed_at?: string | null;
          activated_at?: string | null;
          trust_score?: number;
          reliability_score?: number;
          serious_flag_count?: number;
          requires_admin_review?: boolean;
          application?: Json;
          application_submitted_at?: string | null;
          maidlinx_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string | null;
          professional_id: string | null;
          address_id: string | null;
          service_type:
            | "standard"
            | "deep"
            | "move_in_out"
            | "move_in"
            | "move_out"
            | "commercial"
            | "office"
            | "airbnb_turnover"
            | "post_construction"
            | "event_venue";
          status:
            | "draft"
            | "pending_payment"
            | "confirmed"
            | "awaiting_assignment"
            | "offered"
            | "assigned"
            | "accepted"
            | "on_the_way"
            | "arrived"
            | "in_progress"
            | "completed"
            | "cancelled";
          scheduled_at: string;
          arrival_window_start: string | null;
          arrival_window_end: string | null;
          notes: string | null;
          bedrooms: number;
          bathrooms: number;
          square_footage: number | null;
          extras: Json;
          subtotal_cents: number;
          platform_fee_cents: number;
          total_cents: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          customer_email: string | null;
          customer_first_name: string | null;
          customer_last_name: string | null;
          customer_phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          address_city: string | null;
          address_state: string | null;
          address_postal_code: string | null;
          address_country: string | null;
          address_latitude: number | null;
          address_longitude: number | null;
          google_place_id: string | null;
          pricing_snapshot: Json | null;
          professional_profile_id: string | null;
          cleaner_id: string | null;
          invoice_number: string | null;
          stripe_receipt_url: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          job_checklist: Json;
          started_at: string | null;
          completed_at: string | null;
          market_id: string | null;
          zone_id: string | null;
          service_zone_id: string | null;
          service_id: string | null;
          pricing_model: string | null;
          service_answers: Json;
          booking_answers: Json;
          quote_requested: boolean;
          payment_status: string;
          estimated_duration_minutes: number | null;
          fees_cents: number | null;
          tax_cents: number | null;
          discount_cents: number | null;
          quote_id: string | null;
          coupon_code: string | null;
          idempotency_key: string | null;
          legal_consent_accepted_at: string | null;
          legal_consent_policy_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          professional_id?: string | null;
          address_id?: string | null;
          service_type:
            | "standard"
            | "deep"
            | "move_in_out"
            | "move_in"
            | "move_out"
            | "commercial"
            | "office"
            | "airbnb_turnover"
            | "post_construction"
            | "event_venue";
          status?:
            | "draft"
            | "pending_payment"
            | "confirmed"
            | "awaiting_assignment"
            | "offered"
            | "assigned"
            | "accepted"
            | "on_the_way"
            | "arrived"
            | "in_progress"
            | "completed"
            | "cancelled";
          scheduled_at: string;
          arrival_window_start?: string | null;
          arrival_window_end?: string | null;
          notes?: string | null;
          bedrooms?: number;
          bathrooms?: number;
          square_footage?: number | null;
          extras?: Json;
          subtotal_cents?: number;
          platform_fee_cents?: number;
          total_cents?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          customer_email?: string | null;
          customer_first_name?: string | null;
          customer_last_name?: string | null;
          customer_phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_postal_code?: string | null;
          address_country?: string | null;
          address_latitude?: number | null;
          address_longitude?: number | null;
          google_place_id?: string | null;
          pricing_snapshot?: Json | null;
          professional_profile_id?: string | null;
          cleaner_id?: string | null;
          invoice_number?: string | null;
          stripe_receipt_url?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          job_checklist?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          market_id?: string | null;
          zone_id?: string | null;
          service_zone_id?: string | null;
          service_id?: string | null;
          pricing_model?: string | null;
          service_answers?: Json;
          booking_answers?: Json;
          quote_requested?: boolean;
          payment_status?: string;
          estimated_duration_minutes?: number | null;
          fees_cents?: number | null;
          tax_cents?: number | null;
          discount_cents?: number | null;
          quote_id?: string | null;
          coupon_code?: string | null;
          idempotency_key?: string | null;
          legal_consent_accepted_at?: string | null;
          legal_consent_policy_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          professional_id?: string | null;
          address_id?: string | null;
          service_type?:
            | "standard"
            | "deep"
            | "move_in_out"
            | "move_in"
            | "move_out"
            | "commercial"
            | "office"
            | "airbnb_turnover"
            | "post_construction"
            | "event_venue";
          status?:
            | "draft"
            | "pending_payment"
            | "confirmed"
            | "awaiting_assignment"
            | "offered"
            | "assigned"
            | "accepted"
            | "on_the_way"
            | "arrived"
            | "in_progress"
            | "completed"
            | "cancelled";
          scheduled_at?: string;
          arrival_window_start?: string | null;
          arrival_window_end?: string | null;
          notes?: string | null;
          bedrooms?: number;
          bathrooms?: number;
          square_footage?: number | null;
          extras?: Json;
          subtotal_cents?: number;
          platform_fee_cents?: number;
          total_cents?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          customer_email?: string | null;
          customer_first_name?: string | null;
          customer_last_name?: string | null;
          customer_phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_postal_code?: string | null;
          address_country?: string | null;
          address_latitude?: number | null;
          address_longitude?: number | null;
          google_place_id?: string | null;
          pricing_snapshot?: Json | null;
          professional_profile_id?: string | null;
          cleaner_id?: string | null;
          invoice_number?: string | null;
          stripe_receipt_url?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          job_checklist?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          market_id?: string | null;
          service_zone_id?: string | null;
          zone_id?: string | null;
          service_id?: string | null;
          pricing_model?: "instant" | "quote" | null;
          booking_answers?: Json;
          service_answers?: Json;
          estimated_duration_minutes?: number | null;
          tax_cents?: number;
          discount_cents?: number;
          fees_cents?: number;
          payment_status?: string;
          quote_requested?: boolean;
          quote_id?: string | null;
          coupon_code?: string | null;
          idempotency_key?: string | null;
          legal_consent_accepted_at?: string | null;
          legal_consent_policy_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      booking_events: {
        Row: {
          id: string;
          booking_id: string;
          event_type: string;
          actor_type: string | null;
          actor_id: string | null;
          actor_role: string | null;
          payload: Json;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          event_type: string;
          actor_type?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          payload?: Json;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          event_type?: string;
          actor_type?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          payload?: Json;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      booking_offers: {
        Row: {
          id: string;
          booking_id: string;
          cleaner_id: string;
          status: string;
          match_score: number | null;
          score_breakdown: Json;
          offered_by: string | null;
          created_at: string;
          responded_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          cleaner_id: string;
          status?: string;
          match_score?: number | null;
          score_breakdown?: Json;
          offered_by?: string | null;
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          cleaner_id?: string;
          status?: string;
          match_score?: number | null;
          score_breakdown?: Json;
          offered_by?: string | null;
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      support_issues: {
        Row: {
          id: string;
          booking_id: string | null;
          customer_profile_id: string | null;
          cleaner_profile_id: string | null;
          issue_type: string;
          subject: string;
          description: string | null;
          status: string;
          priority: string;
          assigned_admin_id: string | null;
          resolution: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          customer_profile_id?: string | null;
          cleaner_profile_id?: string | null;
          issue_type: string;
          subject: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assigned_admin_id?: string | null;
          resolution?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          customer_profile_id?: string | null;
          cleaner_profile_id?: string | null;
          issue_type?: string;
          subject?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assigned_admin_id?: string | null;
          resolution?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_job_photos: {
        Row: {
          id: string;
          booking_id: string;
          professional_profile_id: string;
          photo_type: string;
          storage_path: string;
          public_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          professional_profile_id: string;
          photo_type: string;
          storage_path: string;
          public_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          professional_profile_id?: string;
          photo_type?: string;
          storage_path?: string;
          public_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      professional_availability: {
        Row: {
          id: string;
          professional_profile_id: string;
          day_of_week: number;
          arrival_window: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_profile_id: string;
          day_of_week: number;
          arrival_window: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          professional_profile_id?: string;
          day_of_week?: number;
          arrival_window?: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_favorite_cleaners: {
        Row: {
          id: string;
          customer_profile_id: string;
          professional_profile_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_profile_id: string;
          professional_profile_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_profile_id?: string;
          professional_profile_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          profile_id: string;
          email_booking_updates: boolean;
          email_promotions: boolean;
          sms_reminders: boolean;
          push_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          email_booking_updates?: boolean;
          email_promotions?: boolean;
          sms_reminders?: boolean;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          email_booking_updates?: boolean;
          email_promotions?: boolean;
          sms_reminders?: boolean;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pricing_config: {
        Row: {
          id: string;
          service_type: string;
          base_cents: number;
          bedroom_cents: number;
          bathroom_cents: number;
          platform_fee_percent: number;
          is_active: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coupons: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      service_areas: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      disputes: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      refunds: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_audit_log: {
        Row: {
          id: string;
          agent_id: string;
          action: string;
          permission_level: string;
          actor_profile_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          summary: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          action: string;
          permission_level: string;
          actor_profile_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          summary?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_action_approvals: {
        Row: {
          id: string;
          agent_id: string;
          action: string;
          permission_level: string;
          status: string;
          requested_by_profile_id: string | null;
          decided_by_profile_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          summary: string;
          payload: Json;
          decided_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      business_events: {
        Row: {
          id: string;
          event_type: string;
          entity_type: string;
          entity_id: string;
          idempotency_key: string;
          actor_type: string | null;
          actor_id: string | null;
          source: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          entity_type: string;
          entity_id: string;
          idempotency_key: string;
          actor_type?: string | null;
          actor_id?: string | null;
          source?: string;
          payload?: Json;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_recommendations: {
        Row: {
          id: string;
          agent_id: string;
          recommendation_type: string;
          permission_level: string;
          status: string;
          title: string;
          summary: string | null;
          entity_type: string | null;
          entity_id: string | null;
          potential_cents_estimate: number | null;
          confidence: number | null;
          evidence: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_decisions: {
        Row: {
          id: string;
          agent_id: string;
          decision_type: string;
          permission_level: string;
          recommendation_id: string | null;
          decided_by: string;
          decided_by_profile_id: string | null;
          outcome: string;
          summary: string;
          payload: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_actions: {
        Row: {
          id: string;
          agent_id: string;
          action: string;
          permission_level: string;
          status: string;
          decision_id: string | null;
          approval_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          summary: string;
          simulation: boolean;
          payload: Json;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_exceptions: {
        Row: {
          id: string;
          agent_id: string | null;
          exception_type: string;
          severity: string;
          status: string;
          entity_type: string | null;
          entity_id: string | null;
          summary: string;
          payload: Json;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          description: string | null;
          metadata: Json;
          updated_by_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          description?: string | null;
          metadata?: Json;
          updated_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          description?: string | null;
          metadata?: Json;
          updated_by_profile_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_permissions: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      system_logs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          label: string;
          description: string | null;
          base_cents: number;
          bedroom_cents: number;
          bathroom_cents: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          label: string;
          description?: string | null;
          base_cents: number;
          bedroom_cents?: number;
          bathroom_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          description?: string | null;
          base_cents?: number;
          bedroom_cents?: number;
          bathroom_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          profile_id: string | null;
          user_id: string | null;
          amount_cents: number;
          currency: string;
          status: Database["public"]["Enums"]["payment_status"];
          payment_type: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          stripe_receipt_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          profile_id?: string | null;
          user_id?: string | null;
          amount_cents: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          payment_type?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          stripe_receipt_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          profile_id?: string | null;
          user_id?: string | null;
          amount_cents?: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          payment_type?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          stripe_receipt_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_status_history: {
        Row: {
          id: string;
          booking_id: string;
          from_status: Database["public"]["Enums"]["booking_status"] | null;
          to_status: Database["public"]["Enums"]["booking_status"];
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          from_status?: Database["public"]["Enums"]["booking_status"] | null;
          to_status: Database["public"]["Enums"]["booking_status"];
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          from_status?: Database["public"]["Enums"]["booking_status"] | null;
          to_status?: Database["public"]["Enums"]["booking_status"];
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          booking_id: string | null;
          processed_at: string;
          payload_summary: Json;
        };
        Insert: {
          id: string;
          event_type: string;
          booking_id?: string | null;
          processed_at?: string;
          payload_summary?: Json;
        };
        Update: {
          id?: string;
          event_type?: string;
          booking_id?: string | null;
          processed_at?: string;
          payload_summary?: Json;
        };
        Relationships: [];
      };
      booking_quotes: {
        Row: {
          id: string;
          quote_token: string;
          market_id: string | null;
          currency: string;
          service_type: string;
          input_snapshot: Json;
          breakdown: Json;
          subtotal_cents: number;
          platform_fee_cents: number;
          discount_cents: number;
          total_cents: number;
          coupon_code: string | null;
          estimated_duration_minutes: number | null;
          expires_at: string;
          consumed_by_booking_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_token: string;
          market_id?: string | null;
          currency: string;
          service_type: string;
          input_snapshot?: Json;
          breakdown?: Json;
          subtotal_cents: number;
          platform_fee_cents: number;
          discount_cents?: number;
          total_cents: number;
          coupon_code?: string | null;
          estimated_duration_minutes?: number | null;
          expires_at: string;
          consumed_by_booking_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_token?: string;
          market_id?: string | null;
          currency?: string;
          service_type?: string;
          input_snapshot?: Json;
          breakdown?: Json;
          subtotal_cents?: number;
          platform_fee_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          coupon_code?: string | null;
          estimated_duration_minutes?: number | null;
          expires_at?: string;
          consumed_by_booking_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          id: string;
          scope: string;
          market_id: string | null;
          dynamic_pricing_enabled: boolean;
          demand_mult_min: number;
          demand_mult_max: number;
          supply_mult_min: number;
          supply_mult_max: number;
          min_total_cents: number | null;
          max_total_cents: number | null;
          min_contribution_margin_cents: number;
          min_contribution_margin_pct: number;
          cleaner_hourly_cents: number;
          cleaners_default: number;
          travel_base_cents: number;
          complexity_cents_per_point: number;
          recurring_weekly_mult: number;
          recurring_biweekly_mult: number;
          recurring_monthly_mult: number;
          lead_time_same_day_mult: number;
          lead_time_next_day_mult: number;
          weekend_mult: number;
          evening_mult: number;
          max_discount_stack_pct: number;
          params: Json;
          is_active: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      pricing_quotes: {
        Row: {
          id: string;
          booking_quote_id: string | null;
          quote_token: string;
          market_id: string | null;
          currency: string;
          service_type: string;
          input_snapshot: Json;
          public_breakdown: Json;
          calculation_audit: Json;
          cost_estimate_cents: number;
          contribution_margin_cents: number;
          guardrail_applied: boolean;
          dynamic_pricing_applied: boolean;
          demand_multiplier: number;
          supply_multiplier: number;
          experiment_id: string | null;
          experiment_variant: string | null;
          discount_stack: Json;
          subtotal_cents: number;
          platform_fee_cents: number;
          discount_cents: number;
          total_cents: number;
          expires_at: string;
          consumed_by_booking_id: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      pricing_experiments: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          status: string;
          variants: Json;
          market_id: string | null;
          started_at: string | null;
          ended_at: string | null;
          auto_deploy_winner: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      pricing_experiment_assignments: {
        Row: {
          id: string;
          experiment_id: string;
          anonymous_session_id: string;
          variant_id: string;
          pricing_quote_id: string | null;
          booking_id: string | null;
          converted: boolean;
          revenue_cents: number | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      funnel_events: {
        Row: {
          id: string;
          event_name: string;
          anonymous_session_id: string | null;
          profile_id: string | null;
          booking_id: string | null;
          market_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          device_category: string | null;
          browser_category: string | null;
          props: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      market_demand: {
        Row: {
          id: string;
          market_id: string;
          bucket_start: string;
          bucket_end: string;
          demand_index: number;
          booking_requests: number;
          paid_bookings: number;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cleaner_supply: {
        Row: {
          id: string;
          market_id: string;
          bucket_start: string;
          bucket_end: string;
          supply_index: number;
          active_cleaners: number;
          available_cleaners: number;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notification_outbox: {
        Row: {
          id: string;
          channel: string;
          recipient: string;
          subject: string | null;
          body: string;
          template_key: string | null;
          booking_id: string | null;
          profile_id: string | null;
          status: string;
          provider: string | null;
          provider_message_id: string | null;
          attempts: number;
          last_error: string | null;
          scheduled_for: string;
          sent_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel: string;
          recipient: string;
          subject?: string | null;
          body: string;
          template_key?: string | null;
          booking_id?: string | null;
          profile_id?: string | null;
          status?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          recipient?: string;
          subject?: string | null;
          body?: string;
          template_key?: string | null;
          booking_id?: string | null;
          profile_id?: string | null;
          status?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_addons: {
        Row: {
          id: string;
          label: string;
          description: string | null;
          price_cents: number;
          duration_minutes: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          label: string;
          description?: string | null;
          price_cents: number;
          duration_minutes?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          description?: string | null;
          price_cents?: number;
          duration_minutes?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          cleaner_id: string;
          booking_id: string | null;
          amount_cents: number;
          currency: string;
          platform_fee_cents: number;
          customer_total_cents: number | null;
          status: string;
          stripe_transfer_id: string | null;
          stripe_payout_id: string | null;
          period_start: string | null;
          period_end: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          booking_id?: string | null;
          amount_cents: number;
          currency: string;
          platform_fee_cents?: number;
          customer_total_cents?: number | null;
          status?: string;
          stripe_transfer_id?: string | null;
          stripe_payout_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          booking_id?: string | null;
          amount_cents?: number;
          currency?: string;
          platform_fee_cents?: number;
          customer_total_cents?: number | null;
          status?: string;
          stripe_transfer_id?: string | null;
          stripe_payout_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_plans: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_email: string | null;
          address_snapshot: Json;
          service_type: string;
          extras: string[];
          frequency: string;
          preferred_arrival_window: string | null;
          preferred_day_of_week: number | null;
          market_id: string | null;
          currency: string;
          status: string;
          next_occurrence_date: string | null;
          source_booking_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          customer_email?: string | null;
          address_snapshot?: Json;
          service_type: string;
          extras?: string[];
          frequency: string;
          preferred_arrival_window?: string | null;
          preferred_day_of_week?: number | null;
          market_id?: string | null;
          currency?: string;
          status?: string;
          next_occurrence_date?: string | null;
          source_booking_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          customer_email?: string | null;
          address_snapshot?: Json;
          service_type?: string;
          extras?: string[];
          frequency?: string;
          preferred_arrival_window?: string | null;
          preferred_day_of_week?: number | null;
          market_id?: string | null;
          currency?: string;
          status?: string;
          next_occurrence_date?: string | null;
          source_booking_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_occurrences: {
        Row: {
          id: string;
          plan_id: string;
          occurrence_date: string;
          booking_id: string | null;
          status: string;
          generated_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          occurrence_date: string;
          booking_id?: string | null;
          status?: string;
          generated_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          occurrence_date?: string;
          booking_id?: string | null;
          status?: string;
          generated_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          booking_id: string;
          customer_id: string | null;
          discount_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          booking_id: string;
          customer_id?: string | null;
          discount_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          booking_id?: string;
          customer_id?: string | null;
          discount_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      guest_booking_claims: {
        Row: {
          id: string;
          booking_id: string;
          claimed_by: string;
          guest_email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          claimed_by: string;
          guest_email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          claimed_by?: string;
          guest_email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      launch_waitlist: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          market_id: string | null;
          source: string | null;
          page: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          market_id?: string | null;
          source?: string | null;
          page?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          market_id?: string | null;
          source?: string | null;
          page?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "customer" | "professional" | "cleaner" | "admin";
      booking_status:
        | "draft"
        | "pending_payment"
        | "confirmed"
        | "awaiting_assignment"
        | "offered"
        | "assigned"
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled";
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
        | "cancelled";
      cleaner_assignment_source: "self_accept" | "admin_manual" | "offer_accept" | "admin_reassign";
      cleaner_assignment_status: "pending" | "active" | "completed" | "cancelled" | "declined";
      service_type: "standard" | "deep" | "move_in_out" | "move_in" | "move_out" | "commercial" | "office" | "airbnb_turnover" | "post_construction" | "event_venue";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Cleaner = Database["public"]["Tables"]["cleaners"]["Row"];
export type BookingExtra = Database["public"]["Tables"]["booking_extras"]["Row"];
export type CleanerAssignment = Database["public"]["Tables"]["cleaner_assignments"]["Row"];
/** @deprecated Use `User` */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
/** @deprecated Use `Cleaner` */
export type Professional = Database["public"]["Tables"]["professionals"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type ServiceType = Database["public"]["Enums"]["service_type"];
