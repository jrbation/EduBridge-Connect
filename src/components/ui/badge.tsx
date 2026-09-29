import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}) {
  const styles = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border text-foreground",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-red-50 text-red-800 border-red-200",
  } as const;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
