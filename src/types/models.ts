export type MemberRole = "owner" | "editor" | "viewer";

export type ActivityCategory =
  | "activity"
  | "restaurant"
  | "accommodation"
  | "flight"
  | "transport"
  | "free_time"
  | "note"
  | "other";

export type ActivityStatus = "tentative" | "confirmed";

export type TripPhase = "upcoming" | "active" | "completed";

export interface ProfileSummary {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  preferredCurrency: string;
}

export interface TripMember {
  id: string;
  profile: ProfileSummary;
  role: MemberRole;
}

export interface TripDestination {
  id: string;
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  latitude: number;
  longitude: number;
  displayOrder: number;
}

export interface TripSummary {
  id: string;
  name: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  destinations: TripDestination[];
  members: TripMember[];
  travellerCount: number;
  phase: TripPhase;
  currency: string;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  tripName: string;
  inviterName: string;
  invitedEmail: string;
}

export interface ActivityItem {
  id: string;
  tripId: string;
  dayId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  name: string;
  category: ActivityCategory;
  locationName: string | null;
  address: string | null;
  status: ActivityStatus;
  notes: string | null;
  cost: number | null;
  currency: string | null;
  participantIds: string[];
}

export interface TripDay {
  id: string;
  date: string;
  label: string;
  destinationCity: string | null;
  activities: ActivityItem[];
}

export interface BookingSummary {
  id: string;
  type: "flight" | "accommodation" | "train" | "rental_car" | "restaurant" | "ticket" | "other";
  title: string;
  subtitle: string;
  startsAt: string;
  confirmationCode: string | null;
}

export interface VoteSummary {
  id: string;
  question: string;
  optionCount: number;
  responseCount: number;
  isOpen: boolean;
}

export interface BudgetSummary {
  totalBudget: number;
  amountSpent: number;
  remaining: number;
  currency: string;
  percentUsed: number;
}

export interface PackingProgress {
  sharedCompleted: number;
  sharedTotal: number;
  personalCompleted: number;
  personalTotal: number;
}

export interface TripOverviewData {
  trip: TripSummary;
  nextActivity: ActivityItem | null;
  todayActivities: ActivityItem[];
  upcomingBooking: BookingSummary | null;
  openVotes: VoteSummary[];
  budget: BudgetSummary;
  packing: PackingProgress;
  daysWithoutActivities: number;
  planningProgressPercent: number;
}
