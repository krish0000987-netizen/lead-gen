"use client";

import { createClient } from "@/lib/supabase/clients";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { organization: orgName || undefined } },
      });
      if (error) throw error;
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-sm"
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Organization name</label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-sm"
          placeholder="Acme Inc"
        />
        <p className="text-xs text-gray-500">Optional. You can change it later.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
