/**
 * Resolves coordinates for a trip destination from stored city/country text.
 *
 * Secrets (never EXPO_PUBLIC_ / never returned to clients):
 * - GEOAPIFY_API_KEY (private forward-geocoding key)
 * - SUPABASE_SERVICE_ROLE_KEY (controlled coordinate update only)
 *
 * Requires authenticated JWT (verify_jwt: true). Membership is checked before
 * any write. Clients must only send destinationId — never city/country text.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FETCH_TIMEOUT_MS = 8_000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface GeocodeBody {
  destinationId?: unknown;
}

interface DestinationRow {
  id: string;
  trip_id: string;
  city: string;
  country: string;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geoapify_place_id: string | null;
  geocoded_at: string | null;
  display_order: number;
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

function isValidUuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    !UUID_RE.test(trimmed)
  ) {
    return false;
  }
  return true;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function locationPayload(row: DestinationRow) {
  return {
    destinationId: row.id,
    tripId: row.trip_id,
    city: row.city,
    country: row.country,
    countryCode: row.country_code,
    displayOrder: row.display_order,
    latitude: row.latitude,
    longitude: row.longitude,
    geoapifyPlaceId: row.geoapify_place_id,
    geocodedAt: row.geocoded_at,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
  const geoapifyKey = Deno.env.get("GEOAPIFY_API_KEY")?.trim() ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(503, {
      configured: false,
      error: "Destination geocoding is not configured yet.",
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse(401, { error: "Sign in to geocode destinations." });
  }

  let body: GeocodeBody;
  try {
    body = (await req.json()) as GeocodeBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!isValidUuid(body.destinationId)) {
    return jsonResponse(400, { error: "A valid destination id is required." });
  }
  const destinationId = body.destinationId.trim();

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse(401, { error: "Sign in to geocode destinations." });
  }

  const { data: destination, error: destError } = await userClient
    .from("trip_destinations")
    .select(
      "id, trip_id, city, country, country_code, latitude, longitude, geoapify_place_id, geocoded_at, display_order",
    )
    .eq("id", destinationId)
    .maybeSingle();

  if (destError) {
    return jsonResponse(400, { error: "Unable to load destination." });
  }
  if (!destination) {
    return jsonResponse(404, { error: "Destination not found." });
  }

  const row = destination as DestinationRow;

  const { data: membership, error: memberError } = await userClient
    .from("trip_members")
    .select("id")
    .eq("trip_id", row.trip_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (memberError || !membership) {
    return jsonResponse(403, {
      error: "You do not have access to this destination.",
    });
  }

  if (
    isFiniteCoordinate(row.latitude) &&
    isFiniteCoordinate(row.longitude) &&
    isValidLatLng(row.latitude, row.longitude)
  ) {
    return jsonResponse(200, {
      cached: true,
      location: locationPayload(row),
    });
  }

  if (!geoapifyKey) {
    return jsonResponse(503, {
      configured: false,
      error: "Location geocoding is not configured yet.",
    });
  }

  const textParts = [row.city.trim(), row.country.trim()].filter(
    (part) => part.length > 0,
  );
  if (textParts.length === 0) {
    return jsonResponse(422, { error: "Destination has no city or country to geocode." });
  }

  const params = new URLSearchParams({
    text: textParts.join(", "),
    format: "json",
    limit: "1",
    apiKey: geoapifyKey,
  });
  if (row.country_code && /^[A-Za-z]{2}$/.test(row.country_code.trim())) {
    params.set("filter", `countrycode:${row.country_code.trim().toLowerCase()}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let providerLat: number | null = null;
  let providerLng: number | null = null;
  let placeId: string | null = null;

  try {
    const upstream = await fetch(
      `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
      {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    if (!upstream.ok) {
      return jsonResponse(502, {
        error: "Unable to geocode this destination right now.",
      });
    }

    const payload = (await upstream.json()) as {
      results?: Array<{
        lat?: unknown;
        lon?: unknown;
        place_id?: unknown;
      }>;
    };

    const first = Array.isArray(payload.results) ? payload.results[0] : undefined;
    if (
      !first ||
      !isFiniteCoordinate(first.lat) ||
      !isFiniteCoordinate(first.lon) ||
      !isValidLatLng(first.lat, first.lon)
    ) {
      return jsonResponse(404, {
        error: "No coordinates found for this destination.",
      });
    }

    providerLat = first.lat;
    providerLng = first.lon;
    placeId =
      typeof first.place_id === "string" && first.place_id.trim().length > 0
        ? first.place_id.trim().slice(0, 256)
        : null;
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.toLowerCase().includes("abort"));
    return jsonResponse(aborted ? 504 : 502, {
      error: aborted
        ? "Geocoding timed out. Try again."
        : "Unable to geocode this destination right now.",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const geocodedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await serviceClient
    .from("trip_destinations")
    .update({
      latitude: providerLat,
      longitude: providerLng,
      geoapify_place_id: placeId,
      geocoded_at: geocodedAt,
    })
    .eq("id", destinationId)
    .eq("trip_id", row.trip_id)
    .select(
      "id, trip_id, city, country, country_code, latitude, longitude, geoapify_place_id, geocoded_at, display_order",
    )
    .single();

  if (updateError || !updated) {
    return jsonResponse(500, { error: "Unable to save destination coordinates." });
  }

  return jsonResponse(200, {
    cached: false,
    location: locationPayload(updated as DestinationRow),
  });
});
