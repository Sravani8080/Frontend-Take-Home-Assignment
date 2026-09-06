import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { FileMapRepository } from "./store.js";
import { parseMapDocument } from "./schema.js";

/* Resolve paths relative to the project root.
 * In ESM (dev via tsx): derive from import.meta.url.
 * In CJS (production bundle via esbuild --format=cjs): __dirname exists. */
const currentDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const dataDir = path.join(repoRoot, "data", "maps");
const examplePath = path.join(repoRoot, "data", "example-map.json");
const frontendDist = path.join(repoRoot, "frontend", "dist");

async function seedDefaultMap(repo: FileMapRepository): Promise<void> {
  const existing = await repo.get("example");
  if (existing) return;
  const raw = JSON.parse(await fs.readFile(examplePath, "utf8"));
  const document = parseMapDocument(raw);
  await repo.save("example", document);
}

async function main() {
  const port = Number(process.env.PORT ?? 8080);
  const repo = new FileMapRepository(dataDir);
  await seedDefaultMap(repo);

  const staticDir = (await fs.stat(frontendDist).then(() => true).catch(() => false))
    ? frontendDist
    : undefined;

  const app = createApp(repo, staticDir);
  app.listen(port, "0.0.0.0", () => {
    console.log(`AGV map editor listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
