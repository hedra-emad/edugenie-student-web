"use client";
// ─────────────────────────────────────────────────────────────────────────────
// Button — the single, reusable button primitive for the whole student app.
//
// One source of truth for how buttons look and behave, built on the EduGenie
// design tokens (brand #3B1892 / dark #2A1069, radii, error red). Every raw
// <button> and button-styled <Link> should route through this so the UI stays
// consistent.
//
//   <Button>Save</Button>                          // primary, md
//   <Button variant="outline" size="sm">Edit</Button>
//   <Button variant="ghost" size="icon" aria-label="Close"><X /></Button>
//   <Button loading fullWidth>Sign in</Button>
//   <Button variant="destructive" leftIcon={<Trash2 size={16} />}>Remove</Button>
//
// For a link that should look like a button, reuse the exact styles:
//   <Link href="/x" className={buttonClasses({ variant: "primary" })}>Go</Link>
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";
import DotsLoader from "@/components/ui/DotsLoader";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "ghostOnColor"
  | "destructive"
  | "destructiveSoft"
  | "destructiveOutline"
  | "success"
  | "neutral"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
  "relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "rounded-xl transition-all duration-200 select-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B1892] " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#3B1892] text-white shadow-sm hover:bg-[#2A1069] hover:shadow-md active:translate-y-px",
  secondary:
    "bg-violet-50 text-[#3B1892] hover:bg-violet-100 active:translate-y-px",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:border-[#3B1892] hover:text-[#3B1892] hover:bg-violet-50/50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  // For icon/close buttons sitting ON a colored surface (modal headers, toasts).
  ghostOnColor: "text-white/80 hover:bg-white/15 hover:text-white",
  destructive:
    "bg-[#EF4444] text-white shadow-sm hover:bg-[#dc2626] hover:shadow-md active:translate-y-px",
  // Tonal red — a subtle "reset/remove" affordance, not a strong solid CTA.
  destructiveSoft:
    "border border-red-100 bg-red-50 text-red-500 hover:bg-red-100",
  // Bordered red — e.g. a logout button that reads as cautionary, not primary.
  destructiveOutline:
    "border border-red-200 bg-transparent text-red-600 hover:bg-red-50 hover:border-red-300",
  success:
    "bg-[#22C55E] text-white shadow-sm hover:bg-[#16A34A] hover:shadow-md active:translate-y-px",
  neutral:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 active:translate-y-px",
  link: "text-[#3B1892] underline decoration-[#3B1892]/30 underline-offset-2 hover:decoration-[#3B1892] px-0",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10 p-0",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Compose the button class string — shared with button-styled <Link>s. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  // `link` never carries horizontal padding from a size; keep it inline-text-like.
  const sizeCls = variant === "link" ? "" : SIZES[size];
  return [BASE, VARIANTS[variant], sizeCls, fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows the centered DotsLoader in place of the label (label stays in flow, invisible, so the button keeps its size). */
  loading?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

/**
 * The app's reusable button. Forwards refs (some callers focus/trap buttons),
 * defaults `type="button"` (opt into `type="submit"` explicitly), and merges any
 * extra `className` last so one-off layout tweaks still win.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    type = "button",
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && (
        // Absolutely centered so the spinner sits dead-center regardless of
        // label width; the label below stays in flow (invisible) so the button
        // keeps its exact size — no reflow when toggling loading.
        <span className="absolute inset-0 flex items-center justify-center">
          <DotsLoader />
        </span>
      )}
      <span
        className={`inline-flex items-center justify-center gap-2 ${
          loading ? "invisible" : ""
        }`}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
});

export default Button;
