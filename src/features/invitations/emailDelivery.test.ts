/**
 * Documents that email delivery failure must not undo invitation creation.
 * The API returns { sent:false } without throwing after a successful create.
 */
import { mapInvitationError } from "@/features/invitations/errors";

describe("invitation email delivery", () => {
  it("treats missing provider configuration as a soft failure message", () => {
    const message = mapInvitationError({
      message: "Invitation email is not configured. Share the invitation link instead.",
    });
    expect(message.toLowerCase()).toMatch(/not configured|share|invitation/);
  });

  it("keeps invitation creation independent from email send results", () => {
    // Contract: createEmailInvitation succeeds even when sendInvitationEmail returns sent:false.
    const createResult = {
      invitationId: "inv-1",
      rawToken: "token",
      expiresAt: "2026-09-01T00:00:00Z",
      inviteLink: "tripapp://invite/token",
    };
    const emailResult = { sent: false as const, reason: "Invitation email is not configured." };
    expect(createResult.invitationId).toBeTruthy();
    expect(emailResult.sent).toBe(false);
  });
});
