import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={compact ? "Draftline home" : undefined}>
      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-foreground text-background transition-transform group-hover:-rotate-6">
        <span className="font-serif text-xl italic">D</span>
      </span>
      {!compact && <span className="font-serif text-2xl font-semibold tracking-tight">Draftline</span>}
    </Link>
  );
}
