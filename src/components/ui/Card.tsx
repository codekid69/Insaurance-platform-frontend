export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
