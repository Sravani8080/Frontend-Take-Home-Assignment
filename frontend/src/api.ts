import type { MapDocument, StoredMap } from "@shared/types";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchMap(id: string): Promise<StoredMap> {
  return parseJson<StoredMap>(await fetch(`/api/maps/${id}`));
}

export async function saveMap(id: string, document: MapDocument): Promise<StoredMap> {
  return parseJson<StoredMap>(
    await fetch(`/api/maps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    }),
  );
}

export async function listMaps(): Promise<{ id: string; updatedAt: string; nodeCount: number }[]> {
  return parseJson(await fetch("/api/maps"));
}

export async function createMap(document: MapDocument): Promise<StoredMap> {
  return parseJson<StoredMap>(
    await fetch("/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    }),
  );
}

export async function deleteMap(id: string): Promise<void> {
  const response = await fetch(`/api/maps/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete map: HTTP ${response.status}`);
  }
}

