import { describe, expect, it } from "vitest";
import { parseMapDocument } from "./schema";

describe("parseMapDocument", () => {
  it("accepts a valid node list", () => {
    const doc = parseMapDocument({
      map: {
        maxNeighborDistance: 1500,
        nodes: [{ x: 0, y: 0, code: 1, directions: ["North"] }],
      },
    });
    expect(doc.map.nodes).toHaveLength(1);
  });

  it("rejects diagonal-unrelated extra fields and duplicate positions", () => {
    expect(() =>
      parseMapDocument({
        map: {
          maxNeighborDistance: 1500,
          nodes: [
            { x: 0, y: 0, code: 1 },
            { x: 0, y: 0, code: 2 },
          ],
        },
      }),
    ).toThrow();
  });

  it("rejects invalid directions", () => {
    expect(() =>
      parseMapDocument({
        map: {
          maxNeighborDistance: 1500,
          nodes: [{ x: 0, y: 0, code: 1, directions: ["Up"] }],
        },
      }),
    ).toThrow();
  });
});
