import { INDICATORS, MAX_MRU_STACK_SIZE, type MRUPosition } from "../src/types";

describe("INDICATORS", () => {
  it("should have exactly 4 position indicators", () => {
    expect(Object.keys(INDICATORS).length).toBe(4);
  });

  it("should map positions 1-4 to emoji", () => {
    expect(INDICATORS[1]).toBe("🟦");
    expect(INDICATORS[2]).toBe("🟩");
    expect(INDICATORS[3]).toBe("🟧");
    expect(INDICATORS[4]).toBe("🟥");
  });

  it("should use string emoji characters", () => {
    Object.values(INDICATORS).forEach((indicator) => {
      expect(typeof indicator).toBe("string");
      expect(indicator.length).toBeGreaterThan(0);
    });
  });

  it("should have unique indicators for each position", () => {
    const values = Object.values(INDICATORS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe("MAX_MRU_STACK_SIZE", () => {
  it("should be 4", () => {
    expect(MAX_MRU_STACK_SIZE).toBe(4);
  });

  it("should be a positive integer", () => {
    expect(MAX_MRU_STACK_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_MRU_STACK_SIZE)).toBe(true);
  });
});
