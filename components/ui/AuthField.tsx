"use client";

import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  AuthInput                                                          */
/* ------------------------------------------------------------------ */

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Slot opsional di kanan label, misal link "Lupa password?" */
  labelSlot?: ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, labelSlot, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
          {labelSlot}
        </div>
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition
            focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
            ${error ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-slate-200"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

/* ------------------------------------------------------------------ */
/*  AuthCheckbox                                                       */
/* ------------------------------------------------------------------ */

interface AuthCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  label: string;
  onChange?: (checked: boolean) => void;
}

export function AuthCheckbox({
  label,
  id,
  name,
  checked,
  onChange,
  className = "",
  ...props
}: AuthCheckboxProps) {
  const inputId = id ?? name;

  return (
    <label
      htmlFor={inputId}
      className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none"
    >
      <input
        id={inputId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={`h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  AuthErrorBanner                                                     */
/* ------------------------------------------------------------------ */

interface AuthErrorBannerProps {
  message?: string | null;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AuthSubmitButton                                                    */
/* ------------------------------------------------------------------ */

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

export function AuthSubmitButton({
  loading = false,
  loadingLabel = "Memproses...",
  children,
  disabled,
  className = "",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
        transition hover:bg-indigo-500 active:bg-indigo-700
        disabled:cursor-not-allowed disabled:opacity-60
        flex items-center justify-center gap-2
        ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}