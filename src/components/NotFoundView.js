import Link from "next/link";

export default function NotFoundView() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="font-display text-8xl leading-none text-brand">404</p>
      <h1 className="mt-6 text-3xl">Sahifa topilmadi</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-500">Bunday sahifa yo&apos;q yoki o&apos;chirib tashlangan.</p>
      <Link href="/" className="btn-primary mt-8 px-7 py-3.5 text-sm">Bosh sahifaga</Link>
    </div>
  );
}
