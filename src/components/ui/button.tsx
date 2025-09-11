import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-0",
          {
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-lg hover:shadow-xl": variant === 'primary',
            "bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800 shadow-md hover:shadow-lg": variant === 'secondary',
            "bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white border border-slate-600 hover:border-slate-500": variant === 'outline',
            "bg-transparent text-slate-400 hover:bg-slate-800/30 hover:text-white": variant === 'ghost',
            "bg-transparent text-red-400 hover:text-red-300 underline-offset-4 hover:underline": variant === 'link',
          },
          {
            "h-10 px-4 py-2": size === 'default',
            "h-9 px-3 text-xs": size === 'sm',
            "h-12 px-8 text-base": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
