import { STORAGE_KEYS, DEFAULTS } from "../src/constants";

describe("STORAGE_KEYS", () => {
  it("should have breadcrumb count key", () => {
    expect(STORAGE_KEYS.BREADCRUMB_COUNT).toBe("breadcrumbCount");
  });

  it("should have debug logging key", () => {
    expect(STORAGE_KEYS.DEBUG_LOGGING).toBe("debugLoggingEnabled");
  });

  it("should have MRU stack key", () => {
    expect(STORAGE_KEYS.MRU_STACK).toBe("mruStack");
  });

  it("should have all expected keys", () => {
    const keys = Object.keys(STORAGE_KEYS);
    expect(keys).toContain("BREADCRUMB_COUNT");
    expect(keys).toContain("DEBUG_LOGGING");
    expect(keys).toContain("MRU_STACK");
  });

  it("should have string values", () => {
    Object.values(STORAGE_KEYS).forEach((value) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });
});

describe("DEFAULTS", () => {
  it("should default breadcrumb count to 1", () => {
    expect(DEFAULTS.BREADCRUMB_COUNT).toBe(1);
  });

  it("should default debug logging to false", () => {
    expect(DEFAULTS.DEBUG_LOGGING).toBe(false);
  });

  it("should have all expected defaults", () => {
    const keys = Object.keys(DEFAULTS);
    expect(keys).toContain("BREADCRUMB_COUNT");
    expect(keys).toContain("DEBUG_LOGGING");
  });

  it("should have valid breadcrumb count default", () => {
    expect([1, 4]).toContain(DEFAULTS.BREADCRUMB_COUNT);
  });

  it("should have boolean debug logging default", () => {
    expect(typeof DEFAULTS.DEBUG_LOGGING).toBe("boolean");
  });
});
