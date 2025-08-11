export default function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
