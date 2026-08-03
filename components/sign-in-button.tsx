"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInButton({ returnTo = "/studio" }: { returnTo?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL: returnTo });
        setPending(false);
      }}
    >
      {pending ? <LoaderCircle className="mr-2 size-5 animate-spin" /> : <span className="mr-3 grid size-6 place-items-center rounded-full bg-white font-bold text-[#4285f4]">G</span>}
      {pending ? "Connecting…" : "Continue with Google"}
    </Button>
  );
}
