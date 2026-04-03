import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentChipProps {
  name: string;
  onRemove?: () => void;
  className?: string;
}

function AttachmentChip({ name, onRemove, className }: AttachmentChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-border bg-card/80 px-2 py-1 text-xs text-foreground rounded-none",
        className,
      )}
    >
      <Paperclip className="h-3 w-3" />
      <span className="max-w-[150px] truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export { AttachmentChip };
