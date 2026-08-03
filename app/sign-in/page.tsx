import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SignInButton } from "@/components/sign-in-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (session) redirect("/studio");
  const returnTo = query.returnTo?.startsWith("/") ? query.returnTo : "/studio";
  return <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-16"><div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-[0_24px_80px_-36px_rgba(31,28,24,.45)] sm:p-10"><Logo /><p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Creator access</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Your ideas are waiting.</h1><p className="mt-4 leading-7 text-muted-foreground">Sign in to draft, refine, and publish thoughtful work in a studio designed to stay out of your way.</p><div className="mt-8"><SignInButton returnTo={returnTo} /></div><p className="mt-5 text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to publish responsibly and respect your readers.</p></div></div>;
}
