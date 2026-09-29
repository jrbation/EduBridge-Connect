import { describe, it, expect } from "vitest";
import {
  isUserRole,
  homeForRole,
  canAccessPath,
  USER_ROLES,
  PUBLIC_SIGNUP_ROLES,
  ROLE_HOME,
  ROLE_LABELS,
  AUTH_ROUTES,
} from "@/lib/auth/roles";

describe("Role and Route Guard Utilities", () => {
  describe("isUserRole", () => {
    it("returns true for all recognized roles", () => {
      for (const role of USER_ROLES) {
        expect(isUserRole(role)).toBe(true);
      }
    });

    it("returns false for unrecognized values or nil", () => {
      expect(isUserRole("superadmin")).toBe(false);
      expect(isUserRole("guest")).toBe(false);
      expect(isUserRole("")).toBe(false);
      expect(isUserRole(null)).toBe(false);
      expect(isUserRole(undefined)).toBe(false);
    });
  });

  describe("homeForRole", () => {
    it("maps each role to its designated root dashboard path", () => {
      expect(homeForRole("student")).toBe("/student");
      expect(homeForRole("parent")).toBe("/parent");
      expect(homeForRole("teacher")).toBe("/teacher");
      expect(homeForRole("admin")).toBe("/admin");
    });
  });

  describe("canAccessPath", () => {
    it("allows access to public landing page and auth routes for any role", () => {
      for (const role of USER_ROLES) {
        expect(canAccessPath(role, "/")).toBe(true);
        expect(canAccessPath(role, "/auth/callback")).toBe(true);
        for (const authRoute of AUTH_ROUTES) {
          expect(canAccessPath(role, authRoute)).toBe(true);
          expect(canAccessPath(role, `${authRoute}/something`)).toBe(true);
        }
      }
    });

    it("allows students to access student routes and blocks other role routes", () => {
      expect(canAccessPath("student", "/student")).toBe(true);
      expect(canAccessPath("student", "/student/courses")).toBe(true);
      expect(canAccessPath("student", "/student/quizzes")).toBe(true);
      expect(canAccessPath("student", "/student/assignments/123")).toBe(true);

      // Blocked
      expect(canAccessPath("student", "/teacher")).toBe(false);
      expect(canAccessPath("student", "/teacher/classes")).toBe(false);
      expect(canAccessPath("student", "/parent")).toBe(false);
      expect(canAccessPath("student", "/admin")).toBe(false);
    });

    it("allows teachers to access teacher routes and blocks other role routes", () => {
      expect(canAccessPath("teacher", "/teacher")).toBe(true);
      expect(canAccessPath("teacher", "/teacher/grading")).toBe(true);
      expect(canAccessPath("teacher", "/teacher/classes")).toBe(true);

      // Blocked
      expect(canAccessPath("teacher", "/student")).toBe(false);
      expect(canAccessPath("teacher", "/parent")).toBe(false);
      expect(canAccessPath("teacher", "/admin")).toBe(false);
    });

    it("allows parents to access parent routes and blocks other role routes", () => {
      expect(canAccessPath("parent", "/parent")).toBe(true);
      expect(canAccessPath("parent", "/parent/children")).toBe(true);
      expect(canAccessPath("parent", "/parent/payments")).toBe(true);

      // Blocked
      expect(canAccessPath("parent", "/student")).toBe(false);
      expect(canAccessPath("parent", "/teacher")).toBe(false);
      expect(canAccessPath("parent", "/admin")).toBe(false);
    });

    it("allows admins to access admin routes and blocks other role routes", () => {
      expect(canAccessPath("admin", "/admin")).toBe(true);
      expect(canAccessPath("admin", "/admin/users")).toBe(true);
      expect(canAccessPath("admin", "/admin/audit")).toBe(true);

      // Blocked
      expect(canAccessPath("admin", "/student")).toBe(false);
      expect(canAccessPath("admin", "/teacher")).toBe(false);
      expect(canAccessPath("admin", "/parent")).toBe(false);
    });
  });

  describe("Role constants consistency", () => {
    it("PUBLIC_SIGNUP_ROLES is a subset of USER_ROLES excluding admin", () => {
      expect(PUBLIC_SIGNUP_ROLES).not.toContain("admin");
      for (const role of PUBLIC_SIGNUP_ROLES) {
        expect(USER_ROLES).toContain(role);
      }
    });

    it("ROLE_HOME has an entry for every user role", () => {
      for (const role of USER_ROLES) {
        expect(ROLE_HOME[role]).toBe(`/${role}`);
      }
    });

    it("ROLE_LABELS provides human-readable labels for all user roles", () => {
      for (const role of USER_ROLES) {
        expect(typeof ROLE_LABELS[role]).toBe("string");
        expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
      }
    });
  });
});
