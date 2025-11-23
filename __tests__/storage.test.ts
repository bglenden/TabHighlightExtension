import {
  getBreadcrumbCount,
  setBreadcrumbCount,
  getDebugEnabled,
  setDebugEnabled,
  getMruStack,
  setMruStack,
} from "../src/storage";

// Mock chrome.storage
const mockStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
  },
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
  onChanged: {
    addListener: jest.fn(),
  },
};

(globalThis as any).chrome = {
  storage: mockStorage,
};

describe("getBreadcrumbCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return stored value when it is 1", async () => {
    mockStorage.sync.get.mockResolvedValue({ breadcrumbCount: 1 });
    expect(await getBreadcrumbCount()).toBe(1);
  });

  it("should return stored value when it is 4", async () => {
    mockStorage.sync.get.mockResolvedValue({ breadcrumbCount: 4 });
    expect(await getBreadcrumbCount()).toBe(4);
  });

  it("should return default (1) when not stored", async () => {
    mockStorage.sync.get.mockResolvedValue({});
    expect(await getBreadcrumbCount()).toBe(1);
  });

  it("should return default (1) on error", async () => {
    mockStorage.sync.get.mockRejectedValue(new Error("Storage error"));
    expect(await getBreadcrumbCount()).toBe(1);
  });

  it("should validate and return default for invalid values", async () => {
    mockStorage.sync.get.mockResolvedValue({ breadcrumbCount: 99 });
    expect(await getBreadcrumbCount()).toBe(1);
  });

  it("should validate and return default for string value", async () => {
    mockStorage.sync.get.mockResolvedValue({ breadcrumbCount: "4" });
    expect(await getBreadcrumbCount()).toBe(1);
  });

  it("should validate and return default for null", async () => {
    mockStorage.sync.get.mockResolvedValue({ breadcrumbCount: null });
    expect(await getBreadcrumbCount()).toBe(1);
  });
});

describe("setBreadcrumbCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set breadcrumb count to 1", async () => {
    mockStorage.sync.set.mockResolvedValue(undefined);
    await setBreadcrumbCount(1);
    expect(mockStorage.sync.set).toHaveBeenCalledWith({ breadcrumbCount: 1 });
  });

  it("should set breadcrumb count to 4", async () => {
    mockStorage.sync.set.mockResolvedValue(undefined);
    await setBreadcrumbCount(4);
    expect(mockStorage.sync.set).toHaveBeenCalledWith({ breadcrumbCount: 4 });
  });

  it("should throw error on storage failure", async () => {
    const error = new Error("Storage error");
    mockStorage.sync.set.mockRejectedValue(error);
    await expect(setBreadcrumbCount(1)).rejects.toThrow("Storage error");
  });
});

describe("getDebugEnabled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when debug is enabled", async () => {
    mockStorage.local.get.mockResolvedValue({ debugLoggingEnabled: true });
    expect(await getDebugEnabled()).toBe(true);
  });

  it("should return false when debug is disabled", async () => {
    mockStorage.local.get.mockResolvedValue({ debugLoggingEnabled: false });
    expect(await getDebugEnabled()).toBe(false);
  });

  it("should return default (false) when not stored", async () => {
    mockStorage.local.get.mockResolvedValue({});
    expect(await getDebugEnabled()).toBe(false);
  });

  it("should return default (false) on error", async () => {
    mockStorage.local.get.mockRejectedValue(new Error("Storage error"));
    expect(await getDebugEnabled()).toBe(false);
  });
});

describe("setDebugEnabled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should enable debug logging", async () => {
    mockStorage.local.set.mockResolvedValue(undefined);
    await setDebugEnabled(true);
    expect(mockStorage.local.set).toHaveBeenCalledWith({
      debugLoggingEnabled: true,
    });
  });

  it("should disable debug logging", async () => {
    mockStorage.local.set.mockResolvedValue(undefined);
    await setDebugEnabled(false);
    expect(mockStorage.local.set).toHaveBeenCalledWith({
      debugLoggingEnabled: false,
    });
  });

  it("should throw error on storage failure", async () => {
    const error = new Error("Storage error");
    mockStorage.local.set.mockRejectedValue(error);
    await expect(setDebugEnabled(true)).rejects.toThrow("Storage error");
  });
});

describe("getMruStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return stored MRU stack", async () => {
    const stack = [1, 2, 3, 4];
    mockStorage.local.get.mockResolvedValue({ mruStack: stack });
    expect(await getMruStack()).toEqual(stack);
  });

  it("should return empty array when not stored", async () => {
    mockStorage.local.get.mockResolvedValue({});
    expect(await getMruStack()).toEqual([]);
  });

  it("should return empty array when stored value is not an array", async () => {
    mockStorage.local.get.mockResolvedValue({ mruStack: "not an array" });
    expect(await getMruStack()).toEqual([]);
  });

  it("should return empty array when stored value is null", async () => {
    mockStorage.local.get.mockResolvedValue({ mruStack: null });
    expect(await getMruStack()).toEqual([]);
  });

  it("should return empty array on error", async () => {
    mockStorage.local.get.mockRejectedValue(new Error("Storage error"));
    expect(await getMruStack()).toEqual([]);
  });

  it("should handle empty array correctly", async () => {
    mockStorage.local.get.mockResolvedValue({ mruStack: [] });
    expect(await getMruStack()).toEqual([]);
  });
});

describe("setMruStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save MRU stack", async () => {
    const stack = [1, 2, 3, 4];
    mockStorage.local.set.mockResolvedValue(undefined);
    await setMruStack(stack);
    expect(mockStorage.local.set).toHaveBeenCalledWith({ mruStack: stack });
  });

  it("should save empty array", async () => {
    mockStorage.local.set.mockResolvedValue(undefined);
    await setMruStack([]);
    expect(mockStorage.local.set).toHaveBeenCalledWith({ mruStack: [] });
  });

  it("should throw error on storage failure", async () => {
    const error = new Error("Storage error");
    mockStorage.local.set.mockRejectedValue(error);
    await expect(setMruStack([1, 2, 3])).rejects.toThrow("Storage error");
  });
});
