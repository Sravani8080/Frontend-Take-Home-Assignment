import express from "express";
import cors from "cors";
import path from "node:path";
import { ZodError } from "zod";
import { parseMapDocument } from "./schema.js";
import type { MapRepository } from "./store.js";

export function createApp(repo: MapRepository, staticDir?: string): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/maps", async (_req, res, next) => {
    try {
      const maps = await repo.list();
      res.json(
        maps.map((m) => ({
          id: m.id,
          updatedAt: m.updatedAt,
          nodeCount: m.map.nodes.length,
        })),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/maps/:id", async (req, res, next) => {
    try {
      const stored = await repo.get(req.params.id);
      if (!stored) {
        res.status(404).json({ error: "Map not found" });
        return;
      }
      res.json(stored);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/maps", async (req, res, next) => {
    try {
      const document = parseMapDocument(req.body);
      const stored = await repo.create(document);
      res.status(201).json(stored);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/maps/:id", async (req, res, next) => {
    try {
      const document = parseMapDocument(req.body);
      const stored = await repo.save(req.params.id, document);
      res.json(stored);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/maps/:id", async (req, res, next) => {
    try {
      const removed = await repo.remove(req.params.id);
      if (!removed) {
        res.status(404).json({ error: "Map not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid map document", details: error.flatten() });
        return;
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      if (message === "Invalid map id") {
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    },
  );

  return app;
}
