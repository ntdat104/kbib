"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { buttonClass } from "./button";
import { cn } from "@/lib/utils";

export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

export function SubmitButton({
  children,
  pendingText = "Đang xử lý…",
  variant = "primary",
  size = "md",
  className,
  ...rest
}: { children: ReactNode; pendingText?: string; variant?: Parameters<typeof buttonClass>[0]; size?: Parameters<typeof buttonClass>[1] } & ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, size, className)} {...rest}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState | undefined }) {
  if (!state?.error && !state?.message) return null;
  const ok = !state.error;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm",
        ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700",
      )}
    >
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
      <span>{state.error ?? state.message}</span>
    </div>
  );
}

export function Field({ label, hint, error, children, className, htmlFor }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
