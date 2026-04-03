import { useState } from "react";
import { Download } from "lucide-react";
import type { TaskCommentAttachment } from "@aif/shared/browser";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle-button";
import { FileInput } from "@/components/ui/file-input";

interface TaskAttachmentsProps {
  taskId: string;
  attachments: TaskCommentAttachment[];
  onFilesSelected: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export function TaskAttachments({
  taskId,
  attachments,
  onFilesSelected,
  onRemove,
}: TaskAttachmentsProps) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    onFilesSelected(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <ToggleButton expanded={expanded} onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? "Hide attachments" : `Show attachments (${attachments.length})`}
      </ToggleButton>

      {expanded && (
        <>
          <div
            className={`border border-dashed p-3 text-center text-xs transition-colors ${
              dragOver
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-secondary/20 text-muted-foreground"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            Drag files here to attach
          </div>
          <FileInput
            multiple
            label="Attach files"
            onChange={(e) => {
              onFilesSelected(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          {attachments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No files attached to this task.</p>
          ) : (
            <ul className="space-y-1 text-xs text-foreground/85">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 border border-border bg-secondary/30 px-2 py-1.5"
                >
                  <span className="truncate">
                    {file.name} ({file.mimeType || "unknown"}, {file.size} bytes)
                    {file.content == null && !file.path && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        (metadata only)
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {file.path && (
                      <a
                        href={`/tasks/${taskId}/attachments/${encodeURIComponent(file.name)}`}
                        download={file.name}
                        className="inline-flex h-6 items-center gap-1 px-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => onRemove(index)}
                    >
                      Remove
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
