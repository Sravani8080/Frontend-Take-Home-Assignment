import { describe, expect, it } from "vitest";
import { axisDistance, buildEdges, directionFromTo } from "./graph";
import type { MapNode } from "./types";

const n = (x: number, y: number, directions?: MapNode["directions"]): MapNode => ({
  x,
  y,
  code: 1,
  directions,
});

describe("directionFromTo", () => {
  it("maps +X as North and +Y as West", () => {
    expect(directionFromTo(n(0, 0), n(100, 0))).toBe("North");
    expect(directionFromTo(n(0, 0), n(-100, 0))).toBe("South");
    expect(directionFromTo(n(0, 0), n(0, 100))).toBe("West");
    expect(directionFromTo(n(0, 0), n(0, -100))).toBe("East");
  });

  it("returns null for diagonal pairs", () => {
    expect(directionFromTo(n(0, 0), n(10, 10))).toBeNull();
  });
});

describe("axisDistance", () => {
  it("measures axis-aligned distance only", () => {
    expect(axisDistance(n(0, 0), n(0, 500))).toBe(500);
    expect(axisDistance(n(0, 0), n(800, 0))).toBe(800);
    expect(axisDistance(n(0, 0), n(10, 10))).toBeNull();
  });
});

describe("buildEdges", () => {
  it("connects nearest neighbors within maxNeighborDistance", () => {
    const nodes = [n(0, 0, ["North"]), n(1000, 0, ["South"]), n(3000, 0, ["South"])];
    const edges = buildEdges(nodes, 1500);
    expect(edges).toHaveLength(2);
    expect(edges.some((e) => e.fromIndex === 0 && e.toIndex === 1)).toBe(true);
    expect(edges.some((e) => e.fromIndex === 1 && e.toIndex === 0)).toBe(true);
    expect(edges.some((e) => e.fromIndex === 0 && e.toIndex === 2)).toBe(false);
  });

  it("does not skip over a node that sits between two others", () => {
    const nodes = [n(0, 0), n(500, 0), n(1000, 0)];
    const edges = buildEdges(nodes, 1500);
    const skipped = edges.some(
      (e) =>
        (e.fromIndex === 0 && e.toIndex === 2) || (e.fromIndex === 2 && e.toIndex === 0),
    );
    expect(skipped).toBe(false);
  });

  it("respects one-way directions", () => {
    const nodes = [n(0, 0, ["North"]), n(1000, 0, ["North"])];
    const edges = buildEdges(nodes, 1500);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ fromIndex: 0, toIndex: 1, direction: "North" });
  });
});
