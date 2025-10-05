import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-emerald-600 hover:bg-emerald-500 text-white",
  outline: "border border-slate-600 hover:bg-slate-800/60",
  ghost: "hover:bg-slate-800/80",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, variant = "default", size = "md", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
