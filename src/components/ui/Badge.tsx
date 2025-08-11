export default function Badge({
  children,
  tone = "gray",
  className = "",
}: { children: React.ReactNode; tone?: "gray"|"blue"|"green"|"yellow"|"red"|"purple"; className?: string }) {
  const map: Record<string,string> = {
    gray:   "bg-slate-100 text-slate-700",
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-800",
    red:    "bg-red-100 text-red-700",
    purple: "bg-violet-100 text-violet-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]} ${className}`}>{children}</span>;
}
