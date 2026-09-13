import { Suspense } from "react";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-semibold">
            <div className="h-8 w-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-sm font-semibold">
              LG
            </div>
            <span>LeadGenn</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your organization and start prospecting.
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold mb-1">Create account</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Start your free workspace.
          </p>
          <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
            <SignupForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="font-medium underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
