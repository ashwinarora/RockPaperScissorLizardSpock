import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accentTint";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-accent-hi shadow-accentPop disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "border border-hairline-strong text-ink hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/5 disabled:opacity-40",
  danger: "text-loss hover:bg-[rgba(255,138,122,0.1)] border border-[rgba(255,138,122,0.35)] disabled:opacity-40",
  accentTint:
    "bg-[rgba(232,254,90,0.09)] text-accent hover:bg-[rgba(232,254,90,0.16)] border border-[rgba(232,254,90,0.35)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[13px] px-3 py-1.5 rounded-xl2 gap-2",
  md: "text-[14px] px-4 py-2.5 rounded-xl3 gap-2",
  lg: "text-[15px] px-5 py-3.5 rounded-xl3 gap-2.5",
};

export const Button = ({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    className={cn(
      "inline-flex items-center justify-center font-medium transition-all duration-150",
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </button>
);
