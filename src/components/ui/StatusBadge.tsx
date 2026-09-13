import type { OrgRole } from "@/lib/auth/context";

export const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  QUALIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  REPLIED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  MEETING: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  PROPOSAL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  WON: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  LOST: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  DISQUALIFIED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] ?? statusColors.NEW;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export function roleLabel(role: OrgRole) {
  const labels: Record<OrgRole, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MANAGER: "Manager",
    MEMBER: "Member",
    VIEWER: "Viewer",
  };
  return labels[role] ?? role;
}
