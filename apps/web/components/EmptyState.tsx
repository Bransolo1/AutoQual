import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}
      <p className="mt-4 text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
