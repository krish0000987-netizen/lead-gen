"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/clients";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  ListFilter,
  Search,
  Rocket,
  Puzzle,
  Settings,
  LogOut,
  ChevronDown,
  Command,
  Sparkles,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/lists", label: "Lists", icon: ListFilter },
  { href: "/search", label: "Search", icon: Search },
  { href: "/enrichment", label: "Enrichment", icon: Rocket },
  { href: "/integrations", label: "Integrations", icon: Puzzle },
  { href: "/crm", label: "CRM", icon: Target },
  { href: "/sequences", label: "Sequences", icon: Rocket },
  { href: "/email", label: "Email", icon: Puzzle },
  { href: "/automations", label: "Automations", icon: Settings },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children, organizationId, organizationName, email }: { children: React.ReactNode; organizationId: string; organizationName: string; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("created_at");
      const list = data ?? [];
      setWorkspaces(list);
      const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith("active_workspace="))
        ?.split("=")[1];
      if (!current && list.length > 0) setActiveWorkspace(list[0].id);
      else if (current) setActiveWorkspace(current);
    };
    loadWorkspaces();
  }, [organizationId, supabase]);

  const switchWorkspace = (id: string) => {
    setActiveWorkspace(id);
    document.cookie = `active_workspace=${id}; path=/; max-age=31536000`;
    router.refresh();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-black">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-sm font-semibold">
              LG
            </div>
            <div className="font-semibold tracking-tight">LeadGenn</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {nav.map((item) => {
            const active = typeof window !== "undefined" && (window.location.pathname === item.href || window.location.pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-gray-100 dark:bg-gray-900 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 truncate">{email}</div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex items-center px-4 gap-3">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-800 px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">{organizationName}</span>
            <ChevronDown className="h-4 w-4" />
          </div>

          <div className="flex-1" />

          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-800 px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
            <Command className="h-3.5 w-3.5" />
            <span>⌘K</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
