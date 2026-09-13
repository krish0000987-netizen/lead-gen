"use client";

import { createClient } from "@/lib/supabase/clients";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

      let organizationId = existing?.id;
      if (!organizationId) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({ name, created_by: user.id, settings: {} })
          .select("id")
          .single();
        if (orgError) throw orgError;
        organizationId = org.id;
      } else {
        const { error: updateError } = await supabase
          .from("organizations")
          .update({ name })
          .eq("id", organizationId);
        if (updateError) throw updateError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create organization");
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
        <label className="text-sm font-medium">Organization name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-sm"
          placeholder="Acme Inc"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : "Create organization"}
      </button>
    </form>
  );
}
