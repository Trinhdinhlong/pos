import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2 text-sm font-black text-zinc-900 dark:text-zinc-50 transition-all placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/5 dark:focus-visible:ring-white/5 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
