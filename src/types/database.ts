/**
 * Hand-maintained Supabase Database types for Phase 3A.
 *
 * Later: replace this file with output from
 * `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`
 * Keep aligned with `supabase/migrations/*`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TripMemberRole = "owner" | "editor" | "viewer";
export type TripMemberStatus = "accepted" | "left";

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
    };
    Enums: {
      trip_member_role: TripMemberRole;
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
