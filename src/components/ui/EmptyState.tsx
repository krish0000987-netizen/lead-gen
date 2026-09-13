export default function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</div>
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-flex rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm font-medium"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
