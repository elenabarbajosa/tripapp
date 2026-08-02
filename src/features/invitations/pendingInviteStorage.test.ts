import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearPendingInviteToken,
  loadPendingInviteToken,
  savePendingInviteToken,
} from "@/features/invitations/pendingInviteStorage";

describe("pendingInviteStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("preserves a pending invitation token through auth", async () => {
    await savePendingInviteToken("  pending-token-abc  ");
    await expect(loadPendingInviteToken()).resolves.toBe("pending-token-abc");
    await clearPendingInviteToken();
    await expect(loadPendingInviteToken()).resolves.toBeNull();
  });

  it("ignores blank tokens", async () => {
    await savePendingInviteToken("   ");
    await expect(loadPendingInviteToken()).resolves.toBeNull();
  });
});
