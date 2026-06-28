import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[100px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground backdrop-blur-md transition placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
