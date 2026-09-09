import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 rounded font-body text-[14.5px] font-semibold px-[22px] py-[13px] transition-[filter,transform]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-wc-cyan focus-visible:outline-offset-2",
        variant === "primary" && "bg-wc-blue text-white hover:brightness-110",
        variant === "ghost" && "bg-transparent text-wc-text border border-wc-lineStrong font-medium hover:border-wc-blue",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
