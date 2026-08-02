/**
 * Sends a trip invitation email via Resend.
 *
 * Secrets (Supabase Edge Function, never EXPO_PUBLIC_):
 * - RESEND_API_KEY
 * - INVITATION_FROM_EMAIL
 *
 * When secrets are missing, returns 503 with configured:false so the mobile
 * app can still share/copy the invitation link. Invitation creation must not
 * depend on this function succeeding.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface InvitationEmailBody {
  invitation_id?: string;
  email?: string;
  invite_link?: string;
  trip_name?: string;
  inviter_display_name?: string;
  intended_role?: string;
  expires_at?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim() ?? "";
  const fromEmail = Deno.env.get("INVITATION_FROM_EMAIL")?.trim() ?? "";

  if (!resendApiKey || !fromEmail) {
    return jsonResponse(503, {
      sent: false,
      configured: false,
      error: "Invitation email is not configured. Share the invitation link instead.",
    });
  }

  let body: InvitationEmailBody;
  try {
    body = (await req.json()) as InvitationEmailBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const inviteLink = (body.invite_link ?? "").trim();
  const tripName = (body.trip_name ?? "a trip").trim() || "a trip";
  const inviterName = (body.inviter_display_name ?? "A traveller").trim() || "A traveller";
  const role = (body.intended_role ?? "viewer").trim() || "viewer";
  const expiresAt = (body.expires_at ?? "").trim();

  if (!email.includes("@") || !inviteLink) {
    return jsonResponse(400, { error: "email and invite_link are required" });
  }

  const safeTrip = escapeHtml(tripName);
  const safeInviter = escapeHtml(inviterName);
  const safeRole = escapeHtml(role);
  const safeLink = escapeHtml(inviteLink);
  const safeExpires = expiresAt ? escapeHtml(expiresAt) : null;

  const textLines = [
    `${inviterName} invited you to join “${tripName}” on TripApp.`,
    `Role: ${role}`,
    safeExpires ? `Expires: ${expiresAt}` : null,
    "",
    `Open this link to accept or decline:`,
    inviteLink,
  ].filter((line): line is string => line !== null);

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; color: #0f172a; line-height: 1.5;">
    <p><strong>${safeInviter}</strong> invited you to join <strong>${safeTrip}</strong> on TripApp.</p>
    <p>Role: ${safeRole}</p>
    ${safeExpires ? `<p>Expires: ${safeExpires}</p>` : ""}
    <p><a href="${safeLink}" style="display:inline-block;padding:12px 18px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;">Open invitation</a></p>
    <p style="color:#64748b;font-size:14px;">If the button does not work, copy this link:<br/>${safeLink}</p>
  </body>
</html>`;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: `${inviterName} invited you to ${tripName}`,
      text: textLines.join("\n"),
      html,
    }),
  });

  if (!resendResponse.ok) {
    // Do not leak provider payloads or API keys.
    return jsonResponse(502, {
      sent: false,
      configured: true,
      error: "Could not send the invitation email. Share the invitation link instead.",
    });
  }

  return jsonResponse(200, { sent: true, configured: true });
});
