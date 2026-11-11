import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-sunrise grid min-h-[70vh] flex-1 place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-extrabold text-brand-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">Lạc đường rồi, runner ơi!</h1>
        <p className="mt-2 text-muted">Trang bạn tìm không tồn tại hoặc bib đã được bán.</p>
        <Link href="/races" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">Xem giải chạy</Link>
      </div>
    </div>
  );
}
