import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAdminSession, getAdminSession, type AdminSessionPayload } from "./session";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifies email/password against the admin_users table and, on success,
 * establishes a signed session cookie. Returns the session payload or null.
 * Never logs or throws the raw password.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminSessionPayload | null> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);
  if (!user || !user.active) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));

  const session: AdminSessionPayload = { adminId: user.id, email: user.email, role: user.role };
  await createAdminSession(session);
  return session;
}

/**
 * Server-side authorization guard. Call this at the top of every admin
 * server action / route handler / page that mutates data — never rely on
 * the UI hiding a button. Throws if unauthenticated or role-insufficient.
 */
export async function requireAdmin(minRole?: "super_admin" | "operations" | "content_editor") {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED: no active admin session");

  if (minRole === "super_admin" && session.role !== "super_admin") {
    throw new Error("FORBIDDEN: super_admin role required");
  }
  return session;
}

export { getAdminSession } from "./session";
