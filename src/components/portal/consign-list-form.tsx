"use client";

import { useActionState } from "react";
import { listConsignmentAction } from "@/lib/actions/portal";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function ConsignListForm({ id, suggested, cap }: { id: string; suggested: number; cap: number }) {
  const [state, action] = useActionState(listConsignmentAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="price" type="number" step={10000} defaultValue={Math.min(suggested, cap)} max={cap} className="field h-9 w-36" aria-label="Giá đăng" />
      <SubmitButton size="sm">Định giá & đăng</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
