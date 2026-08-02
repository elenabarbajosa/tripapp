import { signInSchema, signUpSchema } from "@/validation/authSchemas";

describe("auth schemas", () => {
  it("accepts a valid sign-in payload", () => {
    const result = signInSchema.safeParse({
      email: "alex@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid emails and short passwords", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("requires matching passwords on sign-up", () => {
    const mismatch = signUpSchema.safeParse({
      displayName: "Alex",
      email: "alex@example.com",
      password: "password123",
      confirmPassword: "password999",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.flatten().fieldErrors.confirmPassword?.[0]).toContain("match");
    }

    const match = signUpSchema.safeParse({
      displayName: "Alex Rivera",
      email: "alex@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(match.success).toBe(true);
  });

  it("requires a display name on sign-up", () => {
    const result = signUpSchema.safeParse({
      displayName: "",
      email: "alex@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });
});
