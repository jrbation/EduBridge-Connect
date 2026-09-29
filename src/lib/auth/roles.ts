export const USER_ROLES = ["student", "parent", "teacher", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PUBLIC_SIGNUP_ROLES = ["student", "parent", "teacher"] as const;
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/teacher",
  admin: "/admin",
};

export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && USER_ROLES.includes(value as UserRole);
}

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (pathname === "/" || pathname.startsWith("/auth")) return true;
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }
  const home = ROLE_HOME[role];
  return pathname === home || pathname.startsWith(`${home}/`);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  parent: "Parent / Guardian",
  teacher: "Teacher",
  admin: "Administrator",
};
