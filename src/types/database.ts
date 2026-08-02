/**
 * Hand-maintained Supabase Database types for Phase 3A/3B/4A.
 *
 * Later: replace this file with output from
 * `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`
 * Keep aligned with `supabase/migrations/*`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TripMemberRole = "owner" | "editor" | "viewer";
export type TripMemberStatus = "accepted" | "left";
export type TripInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked"
  | "expired";
export type TripActivityCategory =
  | "activity"
  | "sightseeing"
  | "food"
  | "nightlife"
  | "shopping"
  | "transport"
  | "other";
export type TripBookingType =
  | "accommodation"
  | "flight"
  | "train"
  | "bus"
  | "car_rental"
  | "restaurant"
  | "activity"
  | "other";
export type TripExpenseCategory =
  | "accommodation"
  | "transport"
  | "food"
  | "activities"
  | "shopping"
  | "other";
export type TripExpenseSplitMethod = "equal" | "exact" | "percentage";
export type TripPackingCategory =
  | "clothes"
  | "toiletries"
  | "electronics"
  | "documents"
  | "medication"
  | "travel"
  | "other";
export type TripPackingScope = "shared" | "personal";
export type TripIdeaCategory =
  | "sightseeing"
  | "food"
  | "activity"
  | "nightlife"
  | "shopping"
  | "transport"
  | "other";
export type TripIdeaStatus = "proposed" | "added_to_itinerary" | "archived";


export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          preferred_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          id: string;
          name: string;
          cover_image_url: string | null;
          start_date: string;
          end_date: string;
          currency: string;
          home_currency: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cover_image_url?: string | null;
          start_date: string;
          end_date: string;
          currency?: string;
          home_currency?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cover_image_url?: string | null;
          start_date?: string;
          end_date?: string;
          currency?: string;
          home_currency?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_destinations: {
        Row: {
          id: string;
          trip_id: string;
          city: string;
          country: string;
          country_code: string | null;
          currency_code: string;
          arrival_date: string;
          departure_date: string;
          latitude: number | null;
          longitude: number | null;
          geoapify_place_id: string | null;
          geocoded_at: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          city: string;
          country: string;
          country_code?: string | null;
          currency_code?: string;
          arrival_date: string;
          departure_date: string;
          latitude?: number | null;
          longitude?: number | null;
          geoapify_place_id?: string | null;
          geocoded_at?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          city?: string;
          country?: string;
          country_code?: string | null;
          currency_code?: string;
          arrival_date?: string;
          departure_date?: string;
          latitude?: number | null;
          longitude?: number | null;
          geoapify_place_id?: string | null;
          geocoded_at?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_destinations_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          label: string | null;
          destination_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          label?: string | null;
          destination_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          label?: string | null;
          destination_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_days_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_days_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "trip_destinations";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: TripMemberRole;
          status: TripMemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: TripMemberRole;
          status?: TripMemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          role?: TripMemberRole;
          status?: TripMemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_invitations: {
        Row: {
          id: string;
          trip_id: string;
          invited_by: string;
          invited_email: string | null;
          intended_role: TripMemberRole;
          token_hash: string;
          status: TripInvitationStatus;
          expires_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          declined_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          invited_by: string;
          invited_email?: string | null;
          intended_role?: TripMemberRole;
          token_hash: string;
          status?: TripInvitationStatus;
          expires_at: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          invited_by?: string;
          invited_email?: string | null;
          intended_role?: TripMemberRole;
          token_hash?: string;
          status?: TripInvitationStatus;
          expires_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_invitations_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_invitations_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_activities: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string;
          destination_id: string | null;
          created_by: string;
          title: string;
          description: string | null;
          category: TripActivityCategory;
          is_all_day: boolean;
          start_time: string | null;
          end_time: string | null;
          location_name: string | null;
          address: string | null;
          geoapify_place_id: string | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id: string;
          destination_id?: string | null;
          created_by: string;
          title: string;
          description?: string | null;
          category?: TripActivityCategory;
          is_all_day?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string;
          destination_id?: string | null;
          created_by?: string;
          title?: string;
          description?: string | null;
          category?: TripActivityCategory;
          is_all_day?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_activities_trip_day_id_fkey";
            columns: ["trip_day_id"];
            isOneToOne: false;
            referencedRelation: "trip_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_activities_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "trip_destinations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_bookings: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          booking_type: TripBookingType;
          title: string;
          provider_name: string | null;
          confirmation_number: string | null;
          booking_reference: string | null;
          status: string | null;
          start_date: string | null;
          start_time: string | null;
          end_date: string | null;
          end_time: string | null;
          location_name: string | null;
          address: string | null;
          geoapify_place_id: string | null;
          latitude: number | null;
          longitude: number | null;
          departure_location: string | null;
          arrival_location: string | null;
          carrier_name: string | null;
          transport_number: string | null;
          terminal: string | null;
          gate: string | null;
          check_in_time: string | null;
          check_out_time: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          booking_type: TripBookingType;
          title: string;
          provider_name?: string | null;
          confirmation_number?: string | null;
          booking_reference?: string | null;
          status?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          departure_location?: string | null;
          arrival_location?: string | null;
          carrier_name?: string | null;
          transport_number?: string | null;
          terminal?: string | null;
          gate?: string | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          created_by?: string;
          booking_type?: TripBookingType;
          title?: string;
          provider_name?: string | null;
          confirmation_number?: string | null;
          booking_reference?: string | null;
          status?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          departure_location?: string | null;
          arrival_location?: string | null;
          carrier_name?: string | null;
          transport_number?: string | null;
          terminal?: string | null;
          gate?: string | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_bookings_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_expenses: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          paid_by: string;
          title: string;
          category: TripExpenseCategory;
          amount_minor: number;
          currency_code: string;
          expense_date: string;
          split_method: TripExpenseSplitMethod;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          paid_by: string;
          title: string;
          category?: TripExpenseCategory;
          amount_minor: number;
          currency_code: string;
          expense_date: string;
          split_method?: TripExpenseSplitMethod;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          created_by?: string;
          paid_by?: string;
          title?: string;
          category?: TripExpenseCategory;
          amount_minor?: number;
          currency_code?: string;
          expense_date?: string;
          split_method?: TripExpenseSplitMethod;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_expense_splits: {
        Row: {
          expense_id: string;
          user_id: string;
          share_amount_minor: number;
          share_percentage: number | null;
          created_at: string;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          share_amount_minor: number;
          share_percentage?: number | null;
          created_at?: string;
        };
        Update: {
          expense_id?: string;
          user_id?: string;
          share_amount_minor?: number;
          share_percentage?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "trip_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_expense_splits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_expense_settlements: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          payer_id: string;
          payee_id: string;
          amount_minor: number;
          currency_code: string;
          settlement_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          payer_id: string;
          payee_id: string;
          amount_minor: number;
          currency_code: string;
          settlement_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          created_by?: string;
          payer_id?: string;
          payee_id?: string;
          amount_minor?: number;
          currency_code?: string;
          settlement_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_expense_settlements_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_expense_settlements_payer_id_fkey";
            columns: ["payer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_expense_settlements_payee_id_fkey";
            columns: ["payee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_packing_items: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          title: string;
          category: TripPackingCategory;
          scope: TripPackingScope;
          assigned_to: string | null;
          quantity: number;
          notes: string | null;
          is_packed: boolean;
          packed_by: string | null;
          packed_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          title: string;
          category?: TripPackingCategory;
          scope?: TripPackingScope;
          assigned_to?: string | null;
          quantity?: number;
          notes?: string | null;
          is_packed?: boolean;
          packed_by?: string | null;
          packed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          created_by?: string;
          title?: string;
          category?: TripPackingCategory;
          scope?: TripPackingScope;
          assigned_to?: string | null;
          quantity?: number;
          notes?: string | null;
          is_packed?: boolean;
          packed_by?: string | null;
          packed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_packing_items_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_packing_items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_packing_items_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_packing_items_packed_by_fkey";
            columns: ["packed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_ideas: {
        Row: {
          id: string;
          trip_id: string;
          destination_id: string | null;
          created_by: string;
          title: string;
          description: string | null;
          category: TripIdeaCategory;
          status: TripIdeaStatus;
          location_name: string | null;
          address: string | null;
          geoapify_place_id: string | null;
          latitude: number | null;
          longitude: number | null;
          promoted_activity_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          destination_id?: string | null;
          created_by: string;
          title: string;
          description?: string | null;
          category?: TripIdeaCategory;
          status?: TripIdeaStatus;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          promoted_activity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          destination_id?: string | null;
          created_by?: string;
          title?: string;
          description?: string | null;
          category?: TripIdeaCategory;
          status?: TripIdeaStatus;
          location_name?: string | null;
          address?: string | null;
          geoapify_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          promoted_activity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_ideas_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_ideas_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "trip_destinations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_ideas_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_ideas_promoted_activity_id_fkey";
            columns: ["promoted_activity_id"];
            isOneToOne: false;
            referencedRelation: "trip_activities";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_idea_votes: {
        Row: {
          idea_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          idea_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          idea_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_idea_votes_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "trip_ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_idea_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_trip: {
        Args: {
          p_name: string;
          p_start_date: string;
          p_end_date: string;
          p_home_currency: string;
          p_cover_image_url?: string | null;
          p_destinations?: Json;
        };
        Returns: string;
      };
      is_accepted_trip_member: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
      get_trip_role: {
        Args: { p_trip_id: string };
        Returns: TripMemberRole;
      };
      is_trip_owner: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
      can_edit_trip: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
      create_trip_invitation: {
        Args: {
          p_trip_id: string;
          p_email: string;
          p_role?: TripMemberRole;
          p_expires_in_hours?: number;
        };
        Returns: {
          invitation_id: string;
          raw_token: string;
          expires_at: string;
        }[];
      };
      create_trip_share_link: {
        Args: {
          p_trip_id: string;
          p_role?: TripMemberRole;
          p_expires_in_hours?: number;
        };
        Returns: {
          invitation_id: string;
          raw_token: string;
          expires_at: string;
        }[];
      };
      get_trip_invitation_preview: {
        Args: { p_raw_token: string };
        Returns: {
          invitation_id: string;
          trip_id: string;
          trip_name: string;
          destination_summary: string | null;
          inviter_display_name: string;
          intended_role: TripMemberRole;
          status: TripInvitationStatus;
          expires_at: string;
          is_expired: boolean;
          is_usable: boolean;
          already_member: boolean;
          requires_email_match: boolean;
          email_matches: boolean | null;
        }[];
      };
      accept_trip_invitation: {
        Args: { p_raw_token: string };
        Returns: string;
      };
      decline_trip_invitation: {
        Args: { p_raw_token: string };
        Returns: undefined;
      };
      revoke_trip_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      update_trip_member_role: {
        Args: {
          p_trip_id: string;
          p_member_user_id: string;
          p_role: TripMemberRole;
        };
        Returns: undefined;
      };
      remove_trip_member: {
        Args: {
          p_trip_id: string;
          p_member_user_id: string;
        };
        Returns: undefined;
      };
      leave_trip: {
        Args: { p_trip_id: string };
        Returns: undefined;
      };
      transfer_trip_ownership: {
        Args: {
          p_trip_id: string;
          p_new_owner_user_id: string;
        };
        Returns: undefined;
      };
      list_my_pending_invitations: {
        Args: Record<string, never>;
        Returns: {
          invitation_id: string;
          trip_id: string;
          trip_name: string;
          destination_summary: string | null;
          inviter_display_name: string;
          intended_role: TripMemberRole;
          expires_at: string;
          created_at: string;
          invited_email: string | null;
        }[];
      };
      accept_trip_invitation_by_id: {
        Args: { p_invitation_id: string };
        Returns: string;
      };
      decline_trip_invitation_by_id: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      shares_accepted_trip_with: {
        Args: { p_other_user_id: string };
        Returns: boolean;
      };
      get_trip_members: {
        Args: { p_trip_id: string };
        Returns: {
          member_id: string;
          trip_id: string;
          user_id: string;
          role: TripMemberRole;
          status: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          preferred_currency: string;
          member_created_at: string;
          member_updated_at: string;
        }[];
      };
      trip_day_belongs_to_trip: {
        Args: { p_trip_day_id: string; p_trip_id: string };
        Returns: boolean;
      };
      trip_destination_belongs_to_trip: {
        Args: { p_destination_id: string; p_trip_id: string };
        Returns: boolean;
      };
      reorder_trip_activities: {
        Args: {
          p_trip_id: string;
          p_trip_day_id: string;
          p_activity_ids: string[];
        };
        Returns: undefined;
      };
      is_accepted_member_of_trip: {
        Args: { p_trip_id: string; p_user_id: string };
        Returns: boolean;
      };
      create_trip_expense: {
        Args: {
          p_trip_id: string;
          p_title: string;
          p_category: TripExpenseCategory;
          p_amount_minor: number;
          p_currency_code: string;
          p_expense_date: string;
          p_paid_by: string;
          p_split_method: TripExpenseSplitMethod;
          p_participant_ids: string[];
          p_share_amounts_minor?: number[] | null;
          p_share_percentages?: number[] | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
      update_trip_expense: {
        Args: {
          p_expense_id: string;
          p_title: string;
          p_category: TripExpenseCategory;
          p_amount_minor: number;
          p_currency_code: string;
          p_expense_date: string;
          p_paid_by: string;
          p_split_method: TripExpenseSplitMethod;
          p_participant_ids: string[];
          p_share_amounts_minor?: number[] | null;
          p_share_percentages?: number[] | null;
          p_notes?: string | null;
        };
        Returns: undefined;
      };
      delete_trip_expense: {
        Args: { p_expense_id: string };
        Returns: undefined;
      };
      record_trip_settlement: {
        Args: {
          p_trip_id: string;
          p_payer_id: string;
          p_payee_id: string;
          p_amount_minor: number;
          p_currency_code: string;
          p_settlement_date: string;
          p_notes?: string | null;
        };
        Returns: string;
      };
      delete_trip_settlement: {
        Args: { p_settlement_id: string };
        Returns: undefined;
      };
      toggle_trip_packing_item: {
        Args: { p_item_id: string };
        Returns: Database["public"]["Tables"]["trip_packing_items"]["Row"];
      };
      reorder_trip_packing_items: {
        Args: { p_trip_id: string; p_item_ids: string[] };
        Returns: undefined;
      };
      map_idea_category_to_activity: {
        Args: { p_category: TripIdeaCategory };
        Returns: TripActivityCategory;
      };
      promote_trip_idea_to_activity: {
        Args: {
          p_idea_id: string;
          p_trip_day_id: string;
          p_destination_id?: string | null;
          p_is_all_day?: boolean;
          p_start_time?: string | null;
          p_end_time?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      trip_member_role: TripMemberRole;
      trip_invitation_status: TripInvitationStatus;
      trip_activity_category: TripActivityCategory;
      trip_booking_type: TripBookingType;
      trip_expense_category: TripExpenseCategory;
      trip_expense_split_method: TripExpenseSplitMethod;
      trip_packing_category: TripPackingCategory;
      trip_packing_scope: TripPackingScope;
      trip_idea_category: TripIdeaCategory;
      trip_idea_status: TripIdeaStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type TripRow = Database["public"]["Tables"]["trips"]["Row"];
export type TripDestinationRow = Database["public"]["Tables"]["trip_destinations"]["Row"];
export type TripDayRow = Database["public"]["Tables"]["trip_days"]["Row"];
export type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];
export type TripInvitationRow = Database["public"]["Tables"]["trip_invitations"]["Row"];
export type TripActivityRow = Database["public"]["Tables"]["trip_activities"]["Row"];
export type TripBookingRow = Database["public"]["Tables"]["trip_bookings"]["Row"];
export type TripExpenseRow = Database["public"]["Tables"]["trip_expenses"]["Row"];
export type TripExpenseSplitRow = Database["public"]["Tables"]["trip_expense_splits"]["Row"];
export type TripExpenseSettlementRow =
  Database["public"]["Tables"]["trip_expense_settlements"]["Row"];
export type TripPackingItemRow = Database["public"]["Tables"]["trip_packing_items"]["Row"];
export type TripIdeaRow = Database["public"]["Tables"]["trip_ideas"]["Row"];
export type TripIdeaVoteRow = Database["public"]["Tables"]["trip_idea_votes"]["Row"];
