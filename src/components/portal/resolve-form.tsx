"use client";

import { useActionState } from "react";
import { resolveDisputeAction } from "@/lib/actions/portal";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function ResolveForm({ id }: { id: string }) {
  const [state, action] = useActionState(resolveDisputeAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={id} />
      <textarea name="resolution" rows={2} className="field" placeholder="Kết luận gửi hai bên…" required />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="outcome" value="buyer" variant="danger" size="sm">Hoàn tiền người mua</SubmitButton>
        <SubmitButton name="outcome" value="seller" variant="trail" size="sm">Giải ngân người bán</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
