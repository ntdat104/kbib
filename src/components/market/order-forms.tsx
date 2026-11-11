"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { disputeAction, reviewAction } from "@/lib/actions/market";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function DisputeForm({ id }: { id: string }) {
  const [state, action] = useActionState(disputeAction, {});
  const [open, setOpen] = useState(false);
  if (state.ok) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-rose-600 hover:underline">
        Gặp vấn đề? Mở tranh chấp
      </button>
    );
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
      <input type="hidden" name="id" value={id} />
      <select name="reason" className="field" required defaultValue="">
        <option value="" disabled>Chọn lý do</option>
        <option>Người bán không phản hồi</option>
        <option>Thông tin đổi tên sai</option>
        <option>BTC từ chối đổi tên</option>
        <option>Nghi ngờ bib giả / trùng</option>
        <option>Khác</option>
      </select>
      <textarea name="detail" rows={3} className="field" placeholder="Mô tả chi tiết, kèm mốc thời gian…" />
      <FormMessage state={state} />
      <SubmitButton variant="danger">Gửi tranh chấp</SubmitButton>
    </form>
  );
}

export function ReviewForm({ id }: { id: string }) {
  const [state, action] = useActionState(reviewAction, {});
  const [rating, setRating] = useState(5);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label="Đánh giá">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} onClick={() => setRating(n)}>
            <Star className={cn("size-7 transition", n <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300")} />
          </button>
        ))}
      </div>
      <textarea name="comment" rows={2} className="field" placeholder="Chia sẻ trải nghiệm với người bán…" />
      <FormMessage state={state} />
      <SubmitButton variant="dark">Gửi đánh giá</SubmitButton>
    </form>
  );
}
