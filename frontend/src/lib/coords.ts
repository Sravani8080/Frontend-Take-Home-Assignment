import type { Direction, MapNode } from "@shared/types";

export interface Camera {
  panX: number;
  panY: number;
  zoom: number;
  rotation: number;
}

/** Screen-space world: North (+X) up, West (+Y) left. */
export function mapToWorld(x: number, y: number): { wx: number; wy: number } {
  return { wx: -y, wy: -x };
}

export function worldToMap(wx: number, wy: number): { x: number; y: number } {
  return { x: -wy, y: -wx };
}

export function worldToScreen(
  wx: number,
  wy: number,
  camera: Camera,
): { sx: number; sy: number } {
  const rad = (camera.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = wx * cos - wy * sin;
  const ry = wx * sin + wy * cos;
  return {
    sx: camera.panX + rx * camera.zoom,
    sy: camera.panY + ry * camera.zoom,
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
): { wx: number; wy: number } {
  const rad = (camera.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const ux = (sx - camera.panX) / camera.zoom;
  const uy = (sy - camera.panY) / camera.zoom;
  return {
    wx: ux * cos + uy * sin,
    wy: -ux * sin + uy * cos,
  };
}

export function screenToMap(sx: number, sy: number, camera: Camera): { x: number; y: number } {
  const world = screenToWorld(sx, sy, camera);
  return worldToMap(world.wx, world.wy);
}

export function mapToScreen(x: number, y: number, camera: Camera): { sx: number; sy: number } {
  const world = mapToWorld(x, y);
  return worldToScreen(world.wx, world.wy, camera);
}

export function fitCamera(
  nodes: MapNode[],
  width: number,
  height: number,
  padding = 64,
): Camera {
  if (nodes.length === 0) {
    return { panX: width / 2, panY: height / 2, zoom: 0.12, rotation: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const { wx, wy } = mapToWorld(node.x, node.y);
    minX = Math.min(minX, wx);
    minY = Math.min(minY, wy);
    maxX = Math.max(maxX, wx);
    maxY = Math.max(maxY, wy);
  }
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const zoom = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return {
    panX: width / 2 - cx * zoom,
    panY: height / 2 - cy * zoom,
    zoom,
    rotation: 0,
  };
}

export function rotateAround(
  camera: Camera,
  sx: number,
  sy: number,
  deltaDegrees: number,
): Camera {
  const world = screenToWorld(sx, sy, camera);
  const next = { ...camera, rotation: camera.rotation + deltaDegrees };
  const after = worldToScreen(world.wx, world.wy, next);
  return {
    ...next,
    panX: camera.panX + (sx - after.sx),
    panY: camera.panY + (sy - after.sy),
  };
}

export function zoomAt(camera: Camera, sx: number, sy: number, factor: number): Camera {
  const world = screenToWorld(sx, sy, camera);
  const zoom = Math.min(4, Math.max(0.02, camera.zoom * factor));
  const next = { ...camera, zoom };
  const after = worldToScreen(world.wx, world.wy, next);
  return {
    ...next,
    panX: camera.panX + (sx - after.sx),
    panY: camera.panY + (sy - after.sy),
  };
}

export function directionAngle(direction: Direction): number {
  switch (direction) {
    case "North":
      return -90;
    case "South":
      return 90;
    case "West":
      return 180;
    case "East":
      return 0;
    default:
      return 0;
  }
}
