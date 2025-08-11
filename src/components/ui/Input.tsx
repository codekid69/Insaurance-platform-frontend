import { cn } from "../../lib/cn";
import React from "react";
type Props = React.InputHTMLAttributes<HTMLInputElement>;
export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "block w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 shadow-sm",
        "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
}
