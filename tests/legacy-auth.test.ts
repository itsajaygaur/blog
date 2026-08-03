import { beforeEach, describe, expect, it, vi } from "vitest";

const { onConflictDoUpdate, values } = vi.hoisted(() => ({
  onConflictDoUpdate: vi.fn(),
  values: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/drizzle", () => ({
  getDb: () => ({
    insert: () => ({
      values,
    }),
  }),
}));

values.mockReturnValue({ onConflictDoUpdate });

import { syncLegacyUser } from "@/lib/legacy-auth";

describe("legacy identity synchronization", () => {
  beforeEach(() => {
    values.mockClear();
    onConflictDoUpdate.mockClear();
  });

  it("creates the rollback-compatible identity required by legacy blog foreign keys", async () => {
    await syncLegacyUser({
      id: "creator-id",
      name: "Creator Name",
      email: "creator@example.com",
      emailVerified: true,
      image: "https://example.com/avatar.jpg",
    });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: "creator-id",
      name: "Creator Name",
      email: "creator@example.com",
      emailVerified: expect.any(Date),
      image: "https://example.com/avatar.jpg",
    }));
    expect(onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
      set: expect.objectContaining({ name: "Creator Name", email: "creator@example.com" }),
    }));
  });

  it("preserves an unverified identity without inventing a verification timestamp", async () => {
    await syncLegacyUser({ id: "new-id", email: "new@example.com", emailVerified: false });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: "new-id",
      name: null,
      emailVerified: null,
      image: null,
    }));
  });
});
