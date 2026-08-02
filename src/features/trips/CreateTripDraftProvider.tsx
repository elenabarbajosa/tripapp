import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type {
  CreateTripBasicsValues,
  CreateTripDestinationItemValues,
} from "@/validation/tripSchemas";

export type TravellerMode = "solo" | "invite_later";

export interface CreateTripDraft {
  basics: CreateTripBasicsValues | null;
  destinations: CreateTripDestinationItemValues[];
  travellerMode: TravellerMode;
}

interface CreateTripDraftContextValue {
  draft: CreateTripDraft;
  setBasics: (values: CreateTripBasicsValues) => void;
  setDestinations: (values: CreateTripDestinationItemValues[]) => void;
  setTravellerMode: (mode: TravellerMode) => void;
  resetDraft: () => void;
}

const emptyDraft = (): CreateTripDraft => ({
  basics: null,
  destinations: [],
  travellerMode: "solo",
});

const CreateTripDraftContext = createContext<CreateTripDraftContextValue | null>(null);

export function CreateTripDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<CreateTripDraft>(emptyDraft);

  const setBasics = useCallback((values: CreateTripBasicsValues) => {
    setDraft((current) => ({ ...current, basics: values }));
  }, []);

  const setDestinations = useCallback((values: CreateTripDestinationItemValues[]) => {
    setDraft((current) => ({ ...current, destinations: values }));
  }, []);

  const setTravellerMode = useCallback((mode: TravellerMode) => {
    setDraft((current) => ({ ...current, travellerMode: mode }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(emptyDraft());
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setBasics,
      setDestinations,
      setTravellerMode,
      resetDraft,
    }),
    [draft, setBasics, setDestinations, setTravellerMode, resetDraft],
  );

  return (
    <CreateTripDraftContext.Provider value={value}>{children}</CreateTripDraftContext.Provider>
  );
}

export function useCreateTripDraft() {
  const context = useContext(CreateTripDraftContext);
  if (!context) {
    throw new Error("useCreateTripDraft must be used within CreateTripDraftProvider");
  }
  return context;
}
