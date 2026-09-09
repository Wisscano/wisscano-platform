"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await loginAdmin(email, password);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Login failed"); return; }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-wc-bg px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[380px] border border-wc-lineStrong rounded-md bg-wc-panel p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-[26px] h-[26px] border-[1.5px] border-wc-blue rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-wc-cyan rounded-sm" />
          </div>
          <span className="font-display font-extrabold text-sm tracking-tight">WISSCANO ADMIN</span>
        </div>

        <label className="font-mono text-[11px] text-wc-textMute">Email</label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 mb-4" autoComplete="username" />

        <label className="font-mono text-[11px] text-wc-textMute">Password</label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 mb-5" autoComplete="current-password" />

        {error && <p className="font-body text-[13px] text-red-400 mb-4">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
