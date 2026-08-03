# Draftline

Draftline is a production-oriented publishing platform for independent creators. It pairs a calm editorial reading experience with a secure creator studio for drafting, autosaving, publishing, discovery, and managed media.

## Highlights

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Better Auth with Google OAuth and database-backed sessions
- Neon Postgres with Drizzle ORM and additive, rollback-safe migrations
- BlockNote JSON documents with sanitized server-rendered HTML
- Vercel Blob direct uploads with owner and file-type validation
- Search, tags, author profiles, RSS, sitemap, JSON-LD, and social metadata
- Vitest, Playwright, Lighthouse budgets, ESLint, and CI

## Local development

1. Copy `.env.example` to `.env.local` and add the required credentials.
2. Install dependencies with `npm install`.
3. Run `npm run db:migrate` and verify with `npm run db:check`.
4. Start the app with `npm run dev`.

The migration creates in-database backup tables before changing the legacy schema and keeps the original auth/post columns for rollback compatibility.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Run Lighthouse while a production server is available on port 3000 with `npm run test:lighthouse`.

## Deployment

Draftline is designed for Vercel with a Neon database and a public Vercel Blob store. Configure production and preview environment variables separately, test migrations against a Neon branch, then promote the validated preview deployment.
