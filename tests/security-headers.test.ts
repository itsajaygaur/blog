import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config.mjs";

describe("security headers", () => {
  it("allows the Vercel Blob client API and resulting Blob hosts", async () => {
    const configuredHeaders = await nextConfig.headers?.();
    const policy = configuredHeaders?.[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;

    expect(policy).toContain("connect-src 'self' https://vercel.com");
    expect(policy).toContain("https://blob.vercel-storage.com");
    expect(policy).toContain("https://*.blob.vercel-storage.com");
    expect(policy).toContain("img-src 'self' data: blob: https://*.public.blob.vercel-storage.com");
  });
});
