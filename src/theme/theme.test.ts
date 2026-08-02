import { branding } from "@/constants/branding";
import { colors } from "@/theme/colors";

describe("branding and theme tokens", () => {
  it("keeps the temporary product name centralized", () => {
    expect(branding.productName).toBe("TripApp");
  });

  it("defines the primary accent colour once", () => {
    expect(colors.primary).toBe("#2563EB");
  });
});
