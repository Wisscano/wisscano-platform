import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-wc-panelAlt border border-wc-line rounded px-[11px] py-[9px] text-wc-text font-body text-[13.5px] outline-none",
        "focus:border-wc-blue placeholder:text-wc-textMute",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
