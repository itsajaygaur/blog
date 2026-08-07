import Link from "next/link";
import { AuthControls } from "@/components/auth-controls";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session";

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary navigation" className="flex items-center gap-1 sm:gap-3">
          <Link href="/stories" className="rounded-full px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3">
            Explore
          </Link>
          <ThemeToggle />
          <AuthControls signedIn={Boolean(session)} />
        </nav>
      </div>
    </header>
  );
}
