import { cn } from "@/lib/cn";

export function Button({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-[#e5e5e5] text-black hover:bg-white",
    ghost: "bg-transparent text-white hover:bg-white/10",
    outline: "bg-[#1f1f1f] text-white hover:bg-[#2b2b2b]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
