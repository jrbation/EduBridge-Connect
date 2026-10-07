import { describe, it, expect } from "vitest";
import { linkChildSchema, relationshipIdSchema } from "@/lib/validations/academic";

describe("Parent-Student Approval Validation", () => {
  describe("linkChildSchema", () => {
    it("should accept valid connection code and relationship", () => {
      const result = linkChildSchema.safeParse({
        code: "ABC123",
        relationship: "guardian",
      });
      expect(result.success).toBe(true);
    });

    it("should reject code less than 4 characters", () => {
      const result = linkChildSchema.safeParse({
        code: "ABC",
        relationship: "guardian",
      });
      expect(result.success).toBe(false);
    });

    it("should accept code with only relationship", () => {
      const result = linkChildSchema.safeParse({
        code: "ABC123",
      });
      expect(result.success).toBe(true);
    });

    it("should default relationship to guardian", () => {
      const result = linkChildSchema.safeParse({
        code: "ABC123",
      });
      if (result.success) {
        expect(result.data.relationship).toBe("guardian");
      }
    });

    it("should reject relationship less than 2 characters", () => {
      const result = linkChildSchema.safeParse({
        code: "ABC123",
        relationship: "x",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("relationshipIdSchema", () => {
    it("should accept valid UUID", () => {
      const result = relationshipIdSchema.safeParse({
        relationshipId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = relationshipIdSchema.safeParse({
        relationshipId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = relationshipIdSchema.safeParse({
        relationshipId: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
