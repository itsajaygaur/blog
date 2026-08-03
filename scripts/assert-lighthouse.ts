import { readFile } from "node:fs/promises";

async function main() {
  const report = JSON.parse(await readFile(".lighthouse.json", "utf8")) as { categories: Record<string, { score: number | null }> };
  const minimums: Record<string, number> = { performance: 0.9, accessibility: 0.95, "best-practices": 0.95, seo: 0.95 };
  const failures = Object.entries(minimums).filter(([category, minimum]) => (report.categories[category]?.score ?? 0) < minimum);
  if (failures.length) throw new Error(`Lighthouse budgets missed: ${failures.map(([category, score]) => `${category} < ${score}`).join(", ")}`);
  console.log("Lighthouse budgets passed.");
}

void main();
