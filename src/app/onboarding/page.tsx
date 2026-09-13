import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization:organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const org = membership?.organization as unknown as { id: string; name: string } | undefined;
  if (org?.name) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-semibold">
            <div className="h-8 w-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-sm font-semibold">
              LG
            </div>
            <span>LeadGenn</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set up your organization to get started.
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold mb-1">Create organization</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            This will be your team&apos;s workspace for prospecting.
          </p>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
