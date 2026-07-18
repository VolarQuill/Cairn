import Link from "next/link";

/** Cairn mark — a small stack of trail stones in warm tones. */
export function Logo({
  size = 32,
  withWord = true,
  href = "/",
}: {
  size?: number;
  withWord?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="23" fill="#14503B" />
        <ellipse cx="24" cy="34" rx="13" ry="5.5" fill="#E4C9A8" />
        <ellipse cx="24" cy="26" rx="10.5" ry="4.6" fill="#DA825A" />
        <ellipse cx="24" cy="19" rx="8" ry="3.8" fill="#F2B454" />
        <ellipse cx="24" cy="13.5" rx="5.4" ry="2.9" fill="#EFD9BD" />
        <circle cx="20.5" cy="12.6" r="0.9" fill="#14503B" />
        <circle cx="27" cy="13.4" r="0.9" fill="#14503B" />
      </svg>
      {withWord && (
        <span className="font-display text-xl font-semibold tracking-tight text-current">
          Cairn
        </span>
      )}
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Cairn home">
      {mark}
    </Link>
  );
}
