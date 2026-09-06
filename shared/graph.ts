import type { Direction, MapNode } from "./types";

export interface Edge {
  fromIndex: number;
  toIndex: number;
  direction: Direction;
  distance: number;
}

export function axisDistance(a: MapNode, b: MapNode): number | null {
  if (a.x === b.x && a.y !== b.y) return Math.abs(a.y - b.y);
  if (a.y === b.y && a.x !== b.x) return Math.abs(a.x - b.x);
  return null;
}

export function directionFromTo(a: MapNode, b: MapNode): Direction | null {
  if (a.y === b.y && b.x > a.x) return "North";
  if (a.y === b.y && b.x < a.x) return "South";
  if (a.x === b.x && b.y > a.y) return "West";
  if (a.x === b.x && b.y < a.y) return "East";
  return null;
}

function isBetween(a: MapNode, mid: MapNode, b: MapNode): boolean {
  if (a.x === b.x && mid.x === a.x) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return mid.y > minY && mid.y < maxY;
  }
  if (a.y === b.y && mid.y === a.y) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    return mid.x > minX && mid.x < maxX;
  }
  return false;
}

function hasNodeBetween(nodes: MapNode[], i: number, j: number): boolean {
  const a = nodes[i];
  const b = nodes[j];
  return nodes.some((mid, k) => k !== i && k !== j && isBetween(a, mid, b));
}

export function canTravel(node: MapNode, direction: Direction): boolean {
  if (node.directions === undefined) return true;
  return node.directions.includes(direction);
}

export function buildEdges(nodes: MapNode[], maxNeighborDistance: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const distance = axisDistance(nodes[i], nodes[j]);
      if (distance === null || distance > maxNeighborDistance) continue;
      if (hasNodeBetween(nodes, i, j)) continue;

      const forward = directionFromTo(nodes[i], nodes[j]);
      const backward = directionFromTo(nodes[j], nodes[i]);
      if (forward && canTravel(nodes[i], forward)) {
        edges.push({ fromIndex: i, toIndex: j, direction: forward, distance });
      }
      if (backward && canTravel(nodes[j], backward)) {
        edges.push({ fromIndex: j, toIndex: i, direction: backward, distance });
      }
    }
  }
  return edges;
}

export function uniquePositions(nodes: MapNode[]): boolean {
  const seen = new Set<string>();
  for (const node of nodes) {
    const key = `${node.x},${node.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}
