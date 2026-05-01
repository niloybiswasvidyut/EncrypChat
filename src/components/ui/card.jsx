import { cn } from "@/lib/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-transparent bg-blackcore/30 p-6 shadow-[0_4px_20px_rgba(0,0,0,.35)]",
        className
      )}
      {...props}
    />
  );
}
