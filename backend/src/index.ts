import fs from "node:fs/promises";
import path from "node:path";
import { createApp } from "./app.js";
import { FileMapRepository } from "./store.js";
import { parseMapDocument } from "./schema.js";

/* Resolve paths relative to the project root.
 * When running via `tsx` in dev, `__dirname` points at `backend/src`.
 * When running the CJS bundle (`node backend/dist/index.cjs`), `__dirname`
 * points at `backend/dist`. Both are two levels below the project root. */
const repoRoot = path.resolve(__dirname, "../..");
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
