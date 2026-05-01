import { cn } from "@/lib/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate bg-transparent px-4 text-sm text-silver placeholder:text-silver/55 focus:border-silver focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
