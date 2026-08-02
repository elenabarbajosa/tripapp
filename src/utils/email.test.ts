import { isValidEmail, normalizeEmail } from "@/utils/email";

describe("email utils", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Alex@Example.COM ")).toBe("alex@example.com");
    expect(normalizeEmail("   ")).toBeNull();
  });

  it("validates email shape", () => {
    expect(isValidEmail("alex@example.com")).toBe(true);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("alex@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
