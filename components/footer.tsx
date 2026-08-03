import { Code2, Contact, MoveUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            A calm place for sharp thinking, generous ideas, and stories worth keeping.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3 text-sm">
          <Link className="inline-flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-secondary" href="https://github.com/itsajaygaur/blog" target="_blank" rel="noreferrer">
            <Code2 className="size-4" /> Source <MoveUpRight className="size-3.5" />
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-secondary" href="https://linkedin.com/in/itsajaygaur" target="_blank" rel="noreferrer">
            <Contact className="size-4" /> LinkedIn <MoveUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="border-t px-4 py-5 text-center text-xs text-muted-foreground">Built by Ajay · Designed for thoughtful publishing.</div>
    </footer>
  );
}
