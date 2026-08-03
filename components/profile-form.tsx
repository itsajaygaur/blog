"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateProfile } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function ProfileForm({ profile }: { profile: { name: string; handle: string; bio: string } }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return <form action={action} className="mt-8 space-y-6"><Field label="Display name" name="name" defaultValue={profile.name} error={state && !state.ok ? state.fieldErrors?.name?.[0] : undefined} /><Field label="Handle" name="handle" defaultValue={profile.handle} prefix="draftline.com/authors/" error={state && !state.ok ? state.fieldErrors?.handle?.[0] : undefined} /><div><label htmlFor="bio" className="text-sm font-semibold">Biography</label><textarea id="bio" name="bio" defaultValue={profile.bio} maxLength={280} rows={5} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-xs text-muted-foreground">A short introduction shown below your stories.</p></div>{state?.message && <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`} aria-live="polite">{state.message}</p>}<Button type="submit" disabled={pending}>{pending && <LoaderCircle className="mr-2 size-4 animate-spin" />}Save profile</Button></form>;
}

function Field({ label, name, defaultValue, prefix, error }: { label: string; name: string; defaultValue: string; prefix?: string; error?: string }) { return <div><label htmlFor={name} className="text-sm font-semibold">{label}</label><div className="mt-2 flex items-center rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring">{prefix && <span className="hidden border-r px-3 text-sm text-muted-foreground sm:block">{prefix}</span>}<input id={name} name={name} defaultValue={defaultValue} className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-4 outline-none" /></div>{error && <p className="mt-1 text-sm text-destructive">{error}</p>}</div>; }
