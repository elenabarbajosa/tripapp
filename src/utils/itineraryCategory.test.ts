import {
  getTripActivityCategoryColor,
  getTripActivityCategoryLabel,
  TRIP_ACTIVITY_CATEGORIES,
} from "@/utils/itineraryCategory";
import { colors } from "@/theme/colors";

describe("itineraryCategory", () => {
  it("covers every TripActivityCategory", () => {
    expect(TRIP_ACTIVITY_CATEGORIES).toEqual([
      "activity",
      "sightseeing",
      "food",
      "nightlife",
      "shopping",
      "transport",
      "other",
    ]);
  });

  it("returns labels and theme colours", () => {
    expect(getTripActivityCategoryLabel("sightseeing")).toBe("Sightseeing");
    expect(getTripActivityCategoryLabel("nightlife")).toBe("Nightlife");
    expect(getTripActivityCategoryColor("food")).toBe(colors.food);
    expect(getTripActivityCategoryColor("shopping")).toBe(colors.shopping);
  });
});
