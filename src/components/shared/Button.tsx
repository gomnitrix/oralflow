import React from "react";

type Variant = "primary" | "secondary" | "ghost";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
};

type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
  variant?: Variant;
};

export type ButtonProps = AnchorProps | NativeButtonProps;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary",
  secondary:
    "bg-surface-card text-white border border-white/10 hover:bg-white/5 focus-visible:outline-white",
  ghost: "bg-transparent text-white hover:bg-white/5 focus-visible:outline-white",
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...props
}) => {
  if ("href" in props && props.href) {
    const { href, ...rest } = props as AnchorProps;
    return (
      <a
        href={href}
        className={cx(
          "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          variantClasses[variant],
          className
        )}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variantClasses[variant],
        className
      )}
      {...(props as NativeButtonProps)}
    >
      {children}
    </button>
  );
};
