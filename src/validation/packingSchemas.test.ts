import { packingItemFormSchema } from "@/validation/packingSchemas";

describe("packingItemFormSchema", () => {
  it("accepts a shared item", () => {
    const result = packingItemFormSchema.safeParse({
      title: "Charger",
      category: "electronics",
      scope: "shared",
      assignedTo: null,
      quantity: 1,
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("requires assignee for personal items", () => {
    const result = packingItemFormSchema.safeParse({
      title: "Passport",
      category: "documents",
      scope: "personal",
      assignedTo: null,
      quantity: 1,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid quantity", () => {
    const result = packingItemFormSchema.safeParse({
      title: "Socks",
      category: "clothes",
      scope: "shared",
      assignedTo: null,
      quantity: 0,
      notes: null,
    });
    expect(result.success).toBe(false);
  });
});
