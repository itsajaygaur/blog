"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        if (navigator.share) await navigator.share({ title, url: window.location.href });
        else {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }
      }}
    >
      {copied ? <Check className="mr-2 size-4" /> : <Share2 className="mr-2 size-4" />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
