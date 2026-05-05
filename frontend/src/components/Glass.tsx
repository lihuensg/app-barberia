import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "strong";
}

export function Glass({ children, className, variant = "default", ...rest }: GlassProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative rounded-2xl border backdrop-blur-xl",
        variant === "default"
          ? "bg-card/60 border-white/10 shadow-lg shadow-black/30"
          : "bg-card/80 border-white/15 shadow-xl shadow-black/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent",
        className,
      )}
    />
  );
}
