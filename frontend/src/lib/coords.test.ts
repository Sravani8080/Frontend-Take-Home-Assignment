import { describe, expect, it } from "vitest";
import {
  fitCamera,
  mapToScreen,
  mapToWorld,
  screenToMap,
  zoomAt,
} from "./coords";

describe("map/world mapping", () => {
  it("places North (+X) up and West (+Y) left", () => {
    const a = mapToWorld(100, 0);
    expect(a.wx + 0).toBe(0);
    expect(a.wy).toBe(-100);
    const b = mapToWorld(0, 100);
    expect(b.wx).toBe(-100);
    expect(b.wy + 0).toBe(0);
  });

  it("round-trips through a camera", () => {
    const camera = { panX: 200, panY: 150, zoom: 0.25, rotation: 30 };
    const screen = mapToScreen(1234, 5678, camera);
    const back = screenToMap(screen.sx, screen.sy, camera);
    expect(back.x).toBeCloseTo(1234, 5);
    expect(back.y).toBeCloseTo(5678, 5);
  });

  it("keeps the cursor world point stable while zooming", () => {
    const camera = { panX: 400, panY: 300, zoom: 0.2, rotation: 15 };
    const sx = 410;
    const sy = 290;
    const before = screenToMap(sx, sy, camera);
    const afterCam = zoomAt(camera, sx, sy, 1.25);
    const after = screenToMap(sx, sy, afterCam);
    expect(after.x).toBeCloseTo(before.x, 4);
    expect(after.y).toBeCloseTo(before.y, 4);
  });

  it("fits nodes inside the viewport", () => {
    const camera = fitCamera(
      [
        { x: 0, y: 0, code: 1 },
        { x: 2000, y: 1000, code: 2 },
      ],
      800,
      600,
    );
    const a = mapToScreen(0, 0, camera);
    const b = mapToScreen(2000, 1000, camera);
    expect(a.sx).toBeGreaterThan(0);
    expect(a.sy).toBeGreaterThan(0);
    expect(b.sx).toBeLessThan(800);
    expect(b.sy).toBeLessThan(600);
  });
});
