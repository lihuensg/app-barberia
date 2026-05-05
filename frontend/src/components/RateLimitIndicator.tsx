import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RateLimitIndicatorProps {
  used: number;
  limit: number;
  label: string;
  resetAtMs?: number;
}

export function RateLimitIndicator({
  used,
  limit,
  label,
  resetAtMs,
}: RateLimitIndicatorProps) {
  const percentage = (used / limit) * 100;
  const remaining = Math.max(0, limit - used);

  const getStatus = () => {
    if (percentage >= 100) return "error";
    if (percentage >= 80) return "warning";
    return "ok";
  };

  const status = getStatus();

  const getIcon = () => {
    switch (status) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getColorClasses = () => {
    switch (status) {
      case "error":
        return "bg-destructive/10 border-destructive/50 text-destructive";
      case "warning":
        return "bg-amber-500/10 border-amber-500/50 text-amber-600";
      default:
        return "bg-emerald-500/10 border-emerald-500/50 text-emerald-600";
    }
  };

  const resetText = resetAtMs
    ? new Date(resetAtMs).toLocaleTimeString()
    : undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        getColorClasses()
      )}
    >
      {getIcon()}
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-xs opacity-75">
          {remaining}/{limit} disponibles
          {resetText && ` • Reset: ${resetText}`}
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-black/10">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status === "error"
                ? "bg-destructive"
                : status === "warning"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
