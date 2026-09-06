import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import { MemoryMapRepository } from "./store";

const sample = {
  map: {
    maxNeighborDistance: 1500,
    nodes: [
      { x: 0, y: 0, code: 1, directions: ["North"] },
      { x: 1000, y: 0, code: 2, directions: ["South"], name: "A" },
    ],
  },
};

describe("maps API", () => {
  it("creates, lists, reads, updates, and deletes a map", async () => {
    const app = createApp(new MemoryMapRepository());

    const created = await request(app).post("/api/maps").send(sample).expect(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body.map.nodes).toHaveLength(2);

    const listed = await request(app).get("/api/maps").expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].nodeCount).toBe(2);

    const id = created.body.id as string;
    const fetched = await request(app).get(`/api/maps/${id}`).expect(200);
    expect(fetched.body.map.nodes[1].name).toBe("A");

    const updated = await request(app)
      .put(`/api/maps/${id}`)
      .send({
        map: {
          maxNeighborDistance: 2000,
          nodes: [{ x: 5, y: 5, code: 9, charger: { direction: "West" } }],
        },
      })
      .expect(200);
    expect(updated.body.map.maxNeighborDistance).toBe(2000);
    expect(updated.body.map.nodes[0].charger.direction).toBe("West");

    await request(app).delete(`/api/maps/${id}`).expect(204);
    await request(app).get(`/api/maps/${id}`).expect(404);
  });

  it("returns 400 for an invalid document", async () => {
    const app = createApp(new MemoryMapRepository());
    await request(app)
      .post("/api/maps")
      .send({ map: { maxNeighborDistance: -1, nodes: [] } })
      .expect(400);
  });

  it("reports health", async () => {
    const app = createApp(new MemoryMapRepository());
    await request(app).get("/api/health").expect(200, { ok: true });
  });
});
