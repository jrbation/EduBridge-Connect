import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
  createAdminSchema,
} from "@/lib/validations/auth";

describe("Authentication Validation Schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@edubridge.test",
        password: "ValidPassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "ValidPassword123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Enter a valid email address");
      }
    });

    it("rejects password shorter than 8 characters", () => {
      const result = loginSchema.safeParse({
        email: "user@edubridge.test",
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Password must be at least 8 characters");
      }
    });
  });

  describe("signupSchema", () => {
    it("accepts valid student signup", () => {
      const result = signupSchema.safeParse({
        fullName: "Jane Doe",
        email: "jane@edubridge.test",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        role: "student",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid teacher and parent roles", () => {
      for (const role of ["teacher", "parent"] as const) {
        const result = signupSchema.safeParse({
          fullName: "Valid User",
          email: `${role}@edubridge.test`,
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          role,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects admin role on public signup", () => {
      const result = signupSchema.safeParse({
        fullName: "Admin Attempt",
        email: "admin@edubridge.test",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        role: "admin",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when passwords do not match", () => {
      const result = signupSchema.safeParse({
        fullName: "Jane Doe",
        email: "jane@edubridge.test",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
        role: "student",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
        expect(mismatchError?.message).toBe("Passwords do not match");
      }
    });

    it("rejects name shorter than 2 characters", () => {
      const result = signupSchema.safeParse({
        fullName: "A",
        email: "a@edubridge.test",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        role: "student",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates correct email format", () => {
      expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: "invalid-email" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts matching passwords of sufficient length", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NewPassword123!",
        confirmPassword: "OtherPassword123!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("profileSchema", () => {
    it("accepts valid profile with empty or provided phone", () => {
      expect(profileSchema.safeParse({ fullName: "Ava Student", phone: "" }).success).toBe(true);
      expect(profileSchema.safeParse({ fullName: "Ava Student", phone: "+1 555-0199" }).success).toBe(true);
      expect(profileSchema.safeParse({ fullName: "Ava Student" }).success).toBe(true);
    });

    it("rejects names shorter than 2 chars", () => {
      expect(profileSchema.safeParse({ fullName: "A" }).success).toBe(false);
    });
  });

  describe("createAdminSchema", () => {
    it("accepts valid admin creation data", () => {
      const result = createAdminSchema.safeParse({
        fullName: "Admin User",
        email: "admin@edubridge.test",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = createAdminSchema.safeParse({
        fullName: "Admin User",
        email: "not-an-email",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = createAdminSchema.safeParse({
        fullName: "Admin User",
        email: "admin@edubridge.test",
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when passwords do not match", () => {
      const result = createAdminSchema.safeParse({
        fullName: "Admin User",
        email: "admin@edubridge.test",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
        expect(mismatchError?.message).toBe("Passwords do not match");
      }
    });

    it("rejects name shorter than 2 characters", () => {
      const result = createAdminSchema.safeParse({
        fullName: "A",
        email: "admin@edubridge.test",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      });
      expect(result.success).toBe(false);
    });
  });
});
