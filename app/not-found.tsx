import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="grain grid min-h-[65vh] place-items-center px-4 text-center"><div><p className="font-serif text-8xl font-semibold text-primary/25">404</p><h1 className="mt-2 font-serif text-4xl font-semibold">This page left the draft.</h1><p className="mx-auto mt-3 max-w-md text-muted-foreground">The story may have moved, been archived, or never made it past the first line.</p><div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/"><ArrowLeft className="mr-2 size-4" />Home</Link></Button><Button asChild variant="outline"><Link href="/stories"><Search className="mr-2 size-4" />Explore</Link></Button></div></div></div>;
}
