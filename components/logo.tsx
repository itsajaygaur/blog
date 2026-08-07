import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Draftline home">
      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-foreground text-background transition-transform group-hover:-rotate-6">
        <span className="font-serif text-xl italic">D</span>
      </span>
      {!compact && <span className="hidden font-serif text-xl font-semibold tracking-tight min-[360px]:inline sm:text-2xl">Draftline</span>}
    </Link>
  );
}
