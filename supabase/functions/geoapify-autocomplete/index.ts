/**
 * Proxies Geoapify Address Autocomplete for authenticated TripApp users.
 *
 * Secret (Supabase Edge Function, never EXPO_PUBLIC_ / never client):
 * - GEOAPIFY_API_KEY
 *
 * Deploy with JWT verification enabled (do not use --no-verify-jwt).
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  DEFAULT_ATTRIBUTION,
  buildGeoapifyAutocompleteUrl,
  mapGeoapifyResults,
  stripSecretsFromPayload,
  validateAutocompleteBody,
  type AutocompleteRequestBody,
} from "./mapping.ts";

const FETCH_TIMEOUT_MS = 8_000;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = Deno.env.get("GEOAPIFY_API_KEY")?.trim() ?? "";
  if (!apiKey) {
    return jsonResponse(503, {
      configured: false,
      error: "Location search is not configured yet.",
      suggestions: [],
      attribution: DEFAULT_ATTRIBUTION,
    });
  }

  let body: AutocompleteRequestBody;
  try {
    body = (await req.json()) as AutocompleteRequestBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const validated = validateAutocompleteBody(body);
  if (!validated.ok) {
    return jsonResponse(validated.status, { error: validated.error });
  }

  const url = buildGeoapifyAutocompleteUrl(validated.value, apiKey);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!upstream.ok) {
      return jsonResponse(502, {
        configured: true,
        error: "Location search is temporarily unavailable. You can enter it manually.",
        suggestions: [],
        attribution: DEFAULT_ATTRIBUTION,
      });
    }

    let payload: unknown;
    try {
      payload = await upstream.json();
    } catch {
      return jsonResponse(502, {
        configured: true,
        error: "Location search is temporarily unavailable. You can enter it manually.",
        suggestions: [],
        attribution: DEFAULT_ATTRIBUTION,
      });
    }

    const safePayload = stripSecretsFromPayload(payload) as {
      results?: unknown;
      attribution?: unknown;
    };
    const suggestions = mapGeoapifyResults(
      safePayload?.results,
      validated.value.limit,
    );

    const attribution =
      typeof safePayload?.attribution === "string" &&
      safePayload.attribution.trim().length > 0
        ? safePayload.attribution.trim()
        : DEFAULT_ATTRIBUTION;

    return jsonResponse(200, {
      configured: true,
      suggestions,
      attribution,
    });
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /abort/i.test(error.message));

    return jsonResponse(aborted ? 504 : 502, {
      configured: true,
      error: "Location search is temporarily unavailable. You can enter it manually.",
      suggestions: [],
      attribution: DEFAULT_ATTRIBUTION,
    });
  } finally {
    clearTimeout(timeoutId);
  }
});
