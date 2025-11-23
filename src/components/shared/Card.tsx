import React from "react";

export interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const Card: React.FC<CardProps> = ({ title, className, children }) => (
  <div className={cx("rounded-2xl bg-surface-card p-4 shadow-card text-white", className)}>
    {title ? <h3 className="text-lg font-semibold mb-2">{title}</h3> : null}
    <div className="space-y-2 text-sm text-white/90">{children}</div>
  </div>
);
