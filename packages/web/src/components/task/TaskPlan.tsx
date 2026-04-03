import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/ui/empty-state";

interface TaskPlanProps {
  plan: string | null;
}

export function TaskPlan({ plan }: TaskPlanProps) {
  const [expanded, setExpanded] = useState(false);

  if (!plan) {
    return <EmptyState message="No plan generated yet" />;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="inline-flex items-center gap-1 border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Hide plan" : "Show plan"}
      </button>

      {expanded && <Markdown content={plan} className="text-sm text-foreground/90" />}
    </div>
  );
}
