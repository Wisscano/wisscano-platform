import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-wc-panelAlt border border-wc-line rounded px-[14px] py-[12px] text-wc-text font-body text-[14.5px] outline-none resize-y",
        "focus:border-wc-blue placeholder:text-wc-textMute",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
