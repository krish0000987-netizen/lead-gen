import Link from "next/link";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
