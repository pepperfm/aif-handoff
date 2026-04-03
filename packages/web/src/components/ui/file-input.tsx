import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ label = "Choose file", className, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const assignRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    return (
      <>
        <input ref={assignRef} type="file" className="hidden" {...props} />
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer rounded-none",
            className,
          )}
          onClick={() => innerRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          {label}
        </button>
      </>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
