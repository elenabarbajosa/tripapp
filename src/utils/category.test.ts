import { getCategoryColor, getCategoryLabel } from "@/utils/category";
import { colors } from "@/theme/colors";

describe("category utilities", () => {
  it("returns readable labels", () => {
    expect(getCategoryLabel("flight")).toBe("Flight");
    expect(getCategoryLabel("free_time")).toBe("Free time");
  });

  it("maps categories to theme colour tokens", () => {
    expect(getCategoryColor("flight")).toBe(colors.flight);
    expect(getCategoryColor("restaurant")).toBe(colors.restaurant);
  });
});
