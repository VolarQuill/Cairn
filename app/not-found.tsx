import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Logo size={48} withWord={false} href={null} />
      <h1 className="mt-5 text-4xl">Lost the trail</h1>
      <p className="mt-2 max-w-sm text-bark-100">
        We couldn&apos;t find that page. Let&apos;s get you back to your learning.
      </p>
      <Link href="/dashboard" className="btn-amber mt-6">
        Go to dashboard
      </Link>
    </main>
  );
}
