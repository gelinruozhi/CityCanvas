import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground backdrop-blur-md transition placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
