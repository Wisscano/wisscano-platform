"use server";

import { verifyAdminCredentials } from "@/lib/auth";
import { destroyAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  if (!email || !password) return { ok: false, error: "Email and password are required" };

  const session = await verifyAdminCredentials(email, password);
  if (!session) return { ok: false, error: "Invalid email or password" };

  return { ok: true };
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}
