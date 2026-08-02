/**
 * Hand-maintained Supabase Database types for Phase 3A/3B.
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
    };
    Enums: {
      trip_member_role: TripMemberRole;
      trip_invitation_status: TripInvitationStatus;
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
