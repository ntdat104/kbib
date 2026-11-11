"use client";

import { useActionState } from "react";
import { createAlertAction } from "@/lib/actions/market";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function AlertForm({ raceId, distances }: { raceId: string; distances: { id: string; name: string; price: number }[] }) {
  const [state, action] = useActionState(createAlertAction, {});
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="raceId" value={raceId} />
      <select name="distanceId" className="field" aria-label="Cự ly" required>
        {distances.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <input name="maxPrice" type="number" step={10000} min={0} placeholder="Giá tối đa (tuỳ chọn)" className="field" aria-label="Giá tối đa" />
      <SubmitButton className="w-full" variant="dark">Bật thông báo</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
