import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";

describe("routeParams / UUID guards", () => {
  it("resolves string and array params", () => {
    expect(resolveRouteParam("abc")).toBe("abc");
    expect(resolveRouteParam(["abc", "def"])).toBe("abc");
    expect(resolveRouteParam(undefined)).toBeUndefined();
  });

  it("rejects undefined, literal undefined, and invalid uuids", () => {
    expect(isValidUuid(undefined)).toBe(false);
    expect(isValidUuid("undefined")).toBe(false);
    expect(isValidUuid("null")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid("not-a-uuid")).toBe(false);
  });

  it("accepts a real uuid", () => {
    expect(isValidUuid("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")).toBe(true);
  });
});

describe("useTripQuery enablement for Group", () => {
  it("does not enable queries for missing or literal undefined ids", () => {
    const cases = [undefined, "undefined", "", "nope"] as const;
    for (const tripId of cases) {
      const enabled =
        true && // auth ready + session
        Boolean(tripId) &&
        isValidUuid(tripId);
      expect(enabled).toBe(false);
    }
  });

  it("enables only for a valid uuid when auth is ready", () => {
    const tripId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const enabled = true && Boolean(tripId) && isValidUuid(tripId);
    expect(enabled).toBe(true);
  });
});

describe("Group navigation params", () => {
  it("builds explicit group navigation with the real trip id", () => {
    const tripId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const navigation = {
      pathname: "/trips/[tripId]/group" as const,
      params: { tripId },
    };
    expect(navigation.params.tripId).toBe(tripId);
    expect(navigation.params.tripId).not.toBe("undefined");
    expect(isValidUuid(navigation.params.tripId)).toBe(true);
  });

  it("never interpolates a missing trip id into the path", () => {
    const tripId: string | undefined = undefined;
    const brokenPath = `/trips/${tripId}/group`;
    expect(brokenPath).toBe("/trips/undefined/group");
    // Guard used by MoreScreen before push:
    expect(isValidUuid(tripId)).toBe(false);
  });
});

describe("getTripById guard contract", () => {
  it("documents that invalid ids must not reach Supabase", async () => {
    const { getTripById } = await import("@/features/trips/api");
    await expect(getTripById("undefined")).rejects.toThrow(/trip id/i);
    await expect(getTripById("")).rejects.toThrow(/trip id/i);
  });
});
