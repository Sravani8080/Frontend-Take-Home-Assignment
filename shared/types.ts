export const DIRECTIONS = ["North", "South", "East", "West"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export interface Charger {
  direction: Direction;
}

export interface Chute {
  direction: Direction;
}

export interface MapNode {
  x: number;
  y: number;
  code: number;
  directions?: Direction[];
  charger?: Charger;
  chute?: Chute;
  name?: string;
}

export interface AgvMap {
  maxNeighborDistance: number;
  nodes: MapNode[];
}

export interface MapDocument {
  map: AgvMap;
}

export interface StoredMap extends MapDocument {
  id: string;
  updatedAt: string;
}

/** North = +X, West = +Y (per challenge spec). */
export const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  North: { dx: 1, dy: 0 },
  South: { dx: -1, dy: 0 },
  West: { dx: 0, dy: 1 },
  East: { dx: 0, dy: -1 },
};
