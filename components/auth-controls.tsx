"use client";

import { LogOut, PenLine, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startNavigation } from "@/components/navigation-progress";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthControls({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();

  if (!signedIn) {
    return (
      <Button asChild size="sm">
        <Link href="/sign-in">
          <span className="sm:hidden">Write</span>
          <span className="hidden sm:inline">Start writing</span>
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/studio"><PenLine className="mr-2 size-4" />Studio</Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Profile settings">
        <Link href="/settings/profile"><Settings className="size-4" /></Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={async () => {
          await authClient.signOut();
          startNavigation();
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
