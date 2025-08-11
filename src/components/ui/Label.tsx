import React from "react";
export default function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-sm font-medium text-slate-700 mb-1" {...props} />;
}
