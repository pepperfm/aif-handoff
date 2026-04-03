import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, message, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("rounded-none border border-dashed border-border py-8 text-center", className)}
    >
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
