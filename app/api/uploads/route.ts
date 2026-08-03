import { randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, eq } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { auth } from "@/lib/auth";
import { getDb } from "@/db/drizzle";
import { media, posts } from "@/db/schema";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";

type Payload = { userId: string; postId: string; size: number; altText: string };

async function verifyImageSignature(url: string, declaredType: string) {
  const response = await fetch(url, { headers: { Range: "bytes=0-4095" } });
  if (!response.ok) throw new Error("Uploaded media could not be verified.");
  const detected = await fileTypeFromBuffer(await response.arrayBuffer());
  const valid = detected && ALLOWED_IMAGE_TYPES.includes(detected.mime as (typeof ALLOWED_IMAGE_TYPES)[number]) && detected.mime === declaredType;
  if (!valid) {
    await del(url);
    throw new Error("The uploaded file signature does not match an allowed image type.");
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new Error("Sign in before uploading media.");
        const payload = JSON.parse(clientPayload ?? "{}") as Partial<Payload>;
        if (!payload.postId || !Number.isFinite(payload.size) || payload.size! > MAX_UPLOAD_BYTES) throw new Error("Invalid upload.");
        const owned = await getDb().query.posts.findFirst({ where: and(eq(posts.id, payload.postId), eq(posts.authorId, session.user.id)), columns: { id: true } });
        if (!owned) throw new Error("You do not have access to this story.");
        if (!pathname.startsWith(`draftline/${payload.postId}/`)) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id, postId: payload.postId, size: payload.size, altText: String(payload.altText ?? "").slice(0, 160) }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as Payload;
        if (!payload.userId || !payload.postId || !ALLOWED_IMAGE_TYPES.includes(blob.contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) throw new Error("Invalid completed upload.");
        await verifyImageSignature(blob.url, blob.contentType);
        await getDb().insert(media).values({ id: randomUUID(), ownerId: payload.userId, postId: payload.postId, pathname: blob.pathname, url: blob.url, contentType: blob.contentType, size: payload.size, altText: payload.altText }).onConflictDoNothing();
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
