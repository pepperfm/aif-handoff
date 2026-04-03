import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/ui/empty-state";

interface TaskLogProps {
  log: string | null;
  label: string;
}

export function TaskLog({ log, label }: TaskLogProps) {
  if (!log) {
    return <EmptyState message={`No ${label.toLowerCase()} yet`} />;
  }

  return (
    <div className="max-h-64 overflow-x-auto overflow-y-auto border border-border bg-secondary/40 p-3">
      <Markdown content={log} className="text-xs text-foreground/90" />
    </div>
  );
}
