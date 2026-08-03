import "server-only";
import { getDb } from "@/db/drizzle";
import { legacyUsers } from "@/db/schema";

type CompatibleUser = {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: boolean | null;
  image?: string | null;
};

export async function syncLegacyUser(user: CompatibleUser) {
  const verifiedAt = user.emailVerified ? new Date() : null;
  await getDb()
    .insert(legacyUsers)
    .values({
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      emailVerified: verifiedAt,
      image: user.image ?? null,
    })
    .onConflictDoUpdate({
      target: legacyUsers.id,
      set: {
        name: user.name ?? null,
        email: user.email,
        emailVerified: verifiedAt,
        image: user.image ?? null,
      },
    });
}
