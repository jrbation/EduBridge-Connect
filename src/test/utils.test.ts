import { describe, it, expect } from "vitest";
import { cn, formatDate, initials, percent, one } from "@/lib/utils";

describe("Pure Utility Functions", () => {
  describe("cn", () => {
    it("merges class names and resolves tailwind collisions", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", false && "text-blue-500", "font-bold")).toBe("text-red-500 font-bold");
    });
  });

  describe("formatDate", () => {
    it("formats valid ISO date strings in Asia/Manila timezone", () => {
      const formatted = formatDate("2026-09-29T10:00:00Z");
      expect(formatted).toMatch(/Sep 29, 2026/);
    });

    it("formats Date objects in Asia/Manila timezone", () => {
      const date = new Date(2026, 0, 15);
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2026/);
    });

    it("includes time when withTime is true in Asia/Manila timezone", () => {
      const formatted = formatDate("2026-09-29T14:30:00Z", true);
      expect(formatted).toMatch(/Sep 29, 2026/);
      expect(formatted).toMatch(/:/); // contains hour:minute
    });

    it("correctly converts UTC to Asia/Manila (UTC+8)", () => {
      // 00:00 UTC = 08:00 PHT
      const formatted = formatDate("2026-09-29T00:00:00Z", true);
      expect(formatted).toMatch(/Sep 29, 2026/);
      expect(formatted).toMatch(/8/); // should show 8 AM PHT
    });

    it("returns em dash for null, undefined, or invalid input", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("not-a-date")).toBe("—");
      expect(formatDate("")).toBe("—");
    });
  });

  describe("initials", () => {
    it("extracts up to two uppercase initials from names", () => {
      expect(initials("Jane Doe")).toBe("JD");
      expect(initials("single")).toBe("S");
      expect(initials("First Middle Last")).toBe("FM");
      expect(initials("  leading   spaces  ")).toBe("LS");
      expect(initials("")).toBe("");
    });
  });

  describe("percent", () => {
    it("computes and rounds percentages accurately", () => {
      expect(percent(3, 4)).toBe(75);
      expect(percent(1, 3)).toBe(33);
      expect(percent(2, 3)).toBe(67);
      expect(percent(10, 10)).toBe(100);
      expect(percent(0, 50)).toBe(0);
    });

    it("safely handles division by zero", () => {
      expect(percent(5, 0)).toBe(0);
      expect(percent(0, 0)).toBe(0);
    });
  });

  describe("one", () => {
    it("unwraps single values and arrays", () => {
      const obj = { id: "1", name: "Test" };
      expect(one(obj)).toBe(obj);
      expect(one([obj])).toBe(obj);
      expect(one([obj, { id: "2" }])).toBe(obj);
    });

    it("handles null, undefined, and empty arrays safely", () => {
      expect(one(null)).toBe(null);
      expect(one(undefined)).toBe(null);
      expect(one([])).toBe(null);
    });
  });
});
