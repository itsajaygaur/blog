import { expect, test } from "@playwright/test";

test("home introduces Draftline and reaches the reading room", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("https://vercel.com");
  expect(response?.headers()["content-security-policy"]).toContain("https://blob.vercel-storage.com");
  await expect(page.getByRole("heading", { name: /make room for better ideas/i })).toBeVisible();
  await page.getByRole("link", { name: /explore stories/i }).first().click();
  await expect(page).toHaveURL(/\/stories/);
  await expect(page.getByRole("heading", { name: /ideas worth your attention/i })).toBeVisible();
});

test("theme toggles keep the page and sticky header in sync", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration failed|server rendered html didn't match/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.goto("/");
  const themeToggle = page.getByRole("button", { name: /switch to (dark|light) theme/i });
  const header = page.locator("header");

  await themeToggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeToggle).toHaveAccessibleName("Switch to light theme");
  expect(await header.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor));

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-mantine-color-scheme", "dark");
    const editorStyles = document.createElement("style");
    editorStyles.textContent = `
      :root[data-mantine-color-scheme='dark'] { --mantine-color-body: #1a1b1e; --mantine-color-text: #c1c2c5; }
      body { background-color: var(--mantine-color-body); color: var(--mantine-color-text); }
    `;
    document.head.appendChild(editorStyles);
  });
  await themeToggle.click();
  await expect(page.locator("html")).toHaveClass(/light/);
  expect(await header.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor));

  await themeToggle.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(themeToggle).toHaveAccessibleName("Switch to dark theme");

  await themeToggle.click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeToggle).toHaveAccessibleName("Switch to light theme");
  expect(hydrationErrors).toEqual([]);
});

test("route changes expose global navigation progress", async ({ page }) => {
  await page.route(/\/stories\?.*_rsc=/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto("/");
  const progress = page.locator("[data-navigation-progress]");
  await page.getByRole("link", { name: /explore stories/i }).first().click({ noWaitAfter: true });
  await expect(progress).toHaveAttribute("data-state", "loading");
  await expect(page).toHaveURL(/\/stories/);
  await expect(progress).toHaveAttribute("data-state", "idle");
});

test("story search has deterministic empty and reset states", async ({ page }) => {
  await page.goto("/stories?q=this-will-never-match-draftline");
  await expect(page.getByRole("heading", { name: "No stories found" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/stories$/);
});

test("protected studio redirects anonymous visitors", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
  await expect(page.getByRole("heading", { name: /your ideas are waiting/i })).toBeVisible();
});

test("story pages expose canonical editorial metadata", async ({ page }) => {
  await page.goto("/stories");
  const firstStory = page.locator("main article h2 a").first();
  const title = (await firstStory.textContent())?.trim();
  await firstStory.click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText(/\d+ min read/).first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/stories\//);
  expect(await page.locator('script[type="application\/ld\+json"]').textContent()).toContain("BlogPosting");
});

test("legacy routes and missing stories recover cleanly", async ({ page }) => {
  await page.goto("/blogs");
  await expect(page).toHaveURL(/\/stories$/);
  await page.goto("/a-story-that-does-not-exist");
  await expect(page.getByRole("heading", { name: /this page left the draft/i })).toBeVisible();
});

test("uploads reject anonymous requests", async ({ request }) => {
  const response = await request.post("/api/uploads", { data: { type: "blob.generate-client-token", payload: {} } });
  expect(response.status()).toBe(400);
});

test("skip link is keyboard reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Touch-only device profiles do not expose keyboard tab navigation.");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
