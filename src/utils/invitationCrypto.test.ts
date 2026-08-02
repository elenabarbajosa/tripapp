import { digestStringAsync } from "expo-crypto";

import { hashInvitationToken } from "@/utils/invitationCrypto";
import { buildInvitationLink, DEFAULT_INVITE_EXPIRY_HOURS } from "@/utils/invitationLink";

describe("invitationCrypto", () => {
  it("hashes tokens with stable SHA-256 hex output", async () => {
    const digest = digestStringAsync as jest.MockedFunction<typeof digestStringAsync>;
    digest.mockImplementation(async (_algorithm, value) => {
      // Deterministic stand-in for SHA-256 in unit tests.
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
      }
      return hash.toString(16).padStart(64, "0");
    });

    const hashA = await hashInvitationToken("test-token-value-123456");
    const hashB = await hashInvitationToken("test-token-value-123456");
    const hashC = await hashInvitationToken("different-token-value-999");

    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);

    digest.mockResolvedValue("test-hashed-nonce");
  });
});

describe("invitationLink", () => {
  it("defaults expiry to seven days", () => {
    expect(DEFAULT_INVITE_EXPIRY_HOURS).toBe(168);
  });

  it("builds a deep-link style invitation URL", () => {
    const link = buildInvitationLink("abc123token");
    expect(link.includes("abc123token")).toBe(true);
    expect(link.includes("invite")).toBe(true);
  });
});
