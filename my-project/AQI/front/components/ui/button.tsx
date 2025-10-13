import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}

const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 shadow",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow",
};

const buttonSizes = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
