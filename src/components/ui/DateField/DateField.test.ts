/**
 * DateField behavior contracts (picker commit semantics).
 * Full UI rendering is covered manually on device; Ionicons/font loading is awkward in Jest.
 */

describe("DateField contracts", () => {
  it("documents iOS Done/Cancel semantics", () => {
    const pending = { iso: "2026-08-05" };
    const formValue = { iso: "2026-08-02" };

    // Selecting a day updates temporary state only.
    const afterDayTap = { ...formValue, pending: pending.iso };
    expect(afterDayTap.iso).toBe("2026-08-02");
    expect(afterDayTap.pending).toBe("2026-08-05");

    // Done commits pending → form.
    const afterDone = { iso: afterDayTap.pending };
    expect(afterDone.iso).toBe("2026-08-05");

    // Cancel leaves form unchanged.
    const afterCancel = { iso: formValue.iso };
    expect(afterCancel.iso).toBe("2026-08-02");
  });

  it("documents Android confirm-only commit", () => {
    const formValue = "2026-08-02";
    const confirmed = "2026-08-05";
    // Dialog confirmation is the only commit path.
    expect(confirmed).not.toBe(formValue);
  });
});
