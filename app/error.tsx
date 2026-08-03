"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center px-4 text-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">A pause in the story</p><h1 className="mt-3 font-serif text-4xl font-semibold">Something did not load.</h1><p className="mx-auto mt-3 max-w-md text-muted-foreground">The page hit an unexpected problem. Your work is still safe—try the page again.</p><Button className="mt-7" onClick={reset}><RotateCcw className="mr-2 size-4" />Try again</Button></div></div>;
}
