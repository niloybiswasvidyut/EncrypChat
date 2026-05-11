import { cn } from "@/lib/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[#2b2b2b] bg-[#171717] px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#e5e5e5] focus:ring-0 transition-colors",
        className
      )}
      {...props}
    />
  );
}
