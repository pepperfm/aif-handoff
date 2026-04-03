import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollableContainerProps {
  maxHeight?: string;
  children: React.ReactNode;
  className?: string;
}

const ScrollableContainer = React.forwardRef<HTMLDivElement, ScrollableContainerProps>(
  ({ maxHeight, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("overflow-y-auto", maxHeight, className)}>
        {children}
      </div>
    );
  },
);
ScrollableContainer.displayName = "ScrollableContainer";

export { ScrollableContainer };
