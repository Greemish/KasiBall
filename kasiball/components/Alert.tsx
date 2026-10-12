import { ReactNode } from "react";

const LEVELS = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export function Alert({
  level = "info",
  title,
  children,
}: {
  level?: keyof typeof LEVELS;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded border p-4 text-sm ${LEVELS[level]}`} role="alert">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}