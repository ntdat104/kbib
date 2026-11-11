import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-extrabold tracking-tight text-ink ${className}`} aria-label="KBIB trang chủ">
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_6px_16px_-6px_rgb(232_90_12/.8)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 18 9 9l4 5 3-4 5 8" />
          <circle cx="17" cy="5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="text-xl">
        K<span className="text-brand-600">BIB</span>
      </span>
    </Link>
  );
}
