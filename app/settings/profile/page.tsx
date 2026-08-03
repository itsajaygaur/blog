import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getDb } from "@/db/drizzle";
import { authUsers } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const session = await requireSession("/settings/profile");
  const profile = await getDb().query.authUsers.findFirst({ where: eq(authUsers.id, session.user.id) });
  if (!profile) notFound();
  return <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Settings</p><h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">Your public profile.</h1><p className="mt-4 leading-7 text-muted-foreground">Help readers understand who is behind the work.</p><ProfileForm profile={{ name: profile.name, handle: profile.handle, bio: profile.bio }} /></div>;
}
