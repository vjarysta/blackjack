import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-emerald-600 bg-emerald-950 px-3 py-1 text-sm text-emerald-100 placeholder:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
