import { cn } from "@/lib/cn";

export function Button({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-silver text-blackcore hover:bg-[#dfdceb]",
    ghost: "bg-transparent text-silver hover:bg-slate/45",
    outline: "border border-slate text-silver hover:bg-slate/35",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-silver/80 disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
