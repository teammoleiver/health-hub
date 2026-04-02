import { cn } from "@/lib/utils";

type Status = "normal" | "borderline" | "high" | "low" | "critical" | "improved";

const statusStyles: Record<Status, string> = {
  normal: "bg-success/10 text-success border-success/20",
  borderline: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  low: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/15 text-destructive border-destructive/30 font-semibold",
  improved: "bg-success/10 text-success border-success/20",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs rounded-full border capitalize",
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
