import { describe, expect, it } from "vitest";
import { DateRange } from "./date-range.value-object.js";

const start = new Date("2030-01-01T15:00:00.000Z");
const end = new Date("2030-02-01T15:00:00.000Z");
const range = () => new DateRange({ startDate: start, endDate: end });

describe("Subscription period invariants", () => {
  it("rejects invalid dates and values that only coerce to a timestamp", () => {
    for (const invalid of [
      new Date(NaN),
      new Date(Infinity),
      null,
      undefined,
      0,
      start.toISOString(),
    ]) {
      expect(() => new DateRange({ startDate: invalid, endDate: end })).toThrow(
        "invalid date",
      );
      expect(
        () => new DateRange({ startDate: start, endDate: invalid }),
      ).toThrow("invalid date");
    }
    expect(() => new DateRange(null)).toThrow("invalid date");
  });

  it("rejects a negative interval even when both dates are valid", () => {
    expect(() => new DateRange({ startDate: end, endDate: start })).toThrow(
      RangeError,
    );
  });

  it("includes both endpoints and excludes one millisecond outside them", () => {
    const period = range();
    expect(period.contains(start)).toBe(true);
    expect(period.contains(end)).toBe(true);
    expect(
      period.contains(new Date((start.getTime() + end.getTime()) / 2)),
    ).toBe(true);
    expect(period.contains(new Date(start.getTime() - 1))).toBe(false);
    expect(period.contains(new Date(end.getTime() + 1))).toBe(false);
  });

  it("supports a zero-duration inclusive interval", () => {
    const period = new DateRange({ startDate: start, endDate: start });
    expect(period.contains(start)).toBe(true);
    expect(period.contains(new Date(start.getTime() + 1))).toBe(false);
  });

  it("does not allow callers to mutate the period through input dates or getters", () => {
    const inputStart = new Date(start);
    const inputEnd = new Date(end);
    const period = new DateRange({ startDate: inputStart, endDate: inputEnd });
    inputStart.setFullYear(1990);
    inputEnd.setTime(NaN);
    period.startDate.setFullYear(2100);
    period.endDate.setTime(NaN);
    expect(period.startDate.toISOString()).toBe(start.toISOString());
    expect(period.endDate.toISOString()).toBe(end.toISOString());
    expect(period.contains(start)).toBe(true);
  });

  it("counts touching boundaries as overlap, but not separated or invalid periods", () => {
    const period = range();
    const touching = new DateRange({
      startDate: end,
      endDate: new Date(end.getTime() + 1),
    });
    const separated = new DateRange({
      startDate: new Date(end.getTime() + 1),
      endDate: new Date(end.getTime() + 2),
    });
    expect(period.overlaps(touching)).toBe(true);
    expect(touching.overlaps(period)).toBe(true);
    expect(period.overlaps(separated)).toBe(false);
    expect(period.overlaps({ startDate: end, endDate: start })).toBe(false);
    expect(period.overlaps({ startDate: new Date(NaN), endDate: end })).toBe(
      false,
    );
    expect(period.overlaps(null)).toBe(false);
  });

  it("returns false for an invalid containment query instead of coercing it", () => {
    for (const invalid of [
      new Date(NaN),
      start.toISOString(),
      start.getTime(),
      null,
      undefined,
    ]) {
      expect(range().contains(invalid)).toBe(false);
    }
  });
});
