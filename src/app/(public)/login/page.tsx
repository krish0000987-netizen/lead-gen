import LoginForm from "./LoginForm";

export default function LoginPage() {
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
            Sign in to your workspace.
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Sign in to continue.
          </p>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-medium underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
