import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "@/db/drizzle";

describe("database configuration", () => {
  it("prefers the primary database URL", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: " postgres://primary ", NEON_DATABASE_URL: "postgres://legacy" })).toBe(
      "postgres://primary",
    );
  });

  it("ignores empty CI secrets and uses the build-safe fallback", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "", NEON_DATABASE_URL: "   " })).toBe(
      "postgresql://draftline:build-only@localhost/draftline",
    );
  });
});
