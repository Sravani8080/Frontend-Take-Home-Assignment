import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MapDocument, StoredMap } from "../../shared/types";

export interface MapRepository {
  list(): Promise<StoredMap[]>;
  get(id: string): Promise<StoredMap | undefined>;
  save(id: string, document: MapDocument): Promise<StoredMap>;
  create(document: MapDocument): Promise<StoredMap>;
  remove(id: string): Promise<boolean>;
}

export class MemoryMapRepository implements MapRepository {
  constructor(private readonly maps = new Map<string, StoredMap>()) {}

  async list(): Promise<StoredMap[]> {
    return [...this.maps.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  async get(id: string): Promise<StoredMap | undefined> {
    return this.maps.get(id);
  }

  async save(id: string, document: MapDocument): Promise<StoredMap> {
    const stored: StoredMap = {
      id,
      updatedAt: new Date().toISOString(),
      map: document.map,
    };
    this.maps.set(id, stored);
    return stored;
  }

  async create(document: MapDocument): Promise<StoredMap> {
    return this.save(randomUUID(), document);
  }

  async remove(id: string): Promise<boolean> {
    return this.maps.delete(id);
  }
}

export class FileMapRepository implements MapRepository {
  constructor(private readonly directory: string) {}

  private filePath(id: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error("Invalid map id");
    }
    return path.join(this.directory, `${id}.json`);
  }

  async list(): Promise<StoredMap[]> {
    await fs.mkdir(this.directory, { recursive: true });
    const files = await fs.readdir(this.directory);
    const maps: StoredMap[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const id = file.slice(0, -5);
      const stored = await this.get(id);
      if (stored) maps.push(stored);
    }
    return maps.sort((a, b) => a.id.localeCompare(b.id));
  }

  async get(id: string): Promise<StoredMap | undefined> {
    try {
      const raw = await fs.readFile(this.filePath(id), "utf8");
      return JSON.parse(raw) as StoredMap;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async save(id: string, document: MapDocument): Promise<StoredMap> {
    await fs.mkdir(this.directory, { recursive: true });
    const stored: StoredMap = {
      id,
      updatedAt: new Date().toISOString(),
      map: document.map,
    };
    await fs.writeFile(this.filePath(id), JSON.stringify(stored, null, 2), "utf8");
    return stored;
  }

  async create(document: MapDocument): Promise<StoredMap> {
    return this.save(randomUUID(), document);
  }

  async remove(id: string): Promise<boolean> {
    try {
      await fs.unlink(this.filePath(id));
      return true;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return false;
      throw error;
    }
  }
}
