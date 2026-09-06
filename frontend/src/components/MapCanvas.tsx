import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { buildEdges } from "@shared/graph";
import { DIRECTION_DELTA, type Direction, type MapNode } from "@shared/types";
import {
  type Camera,
  directionAngle,
  mapToWorld,
  screenToMap,
  zoomAt,
} from "../lib/coords";
import type { Tool } from "./Toolbar";

interface Props {
  nodes: MapNode[];
  maxNeighborDistance: number;
  selectedIndex: number | null;
  camera: Camera;
  tool: Tool;
  onCameraChange: (camera: Camera) => void;
  onSelect: (index: number | null) => void;
  onMoveNode: (index: number, x: number, y: number) => void;
  onAddNode: (x: number, y: number) => void;
  onViewportChange?: (size: { width: number; height: number }) => void;
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function nodeRadius(zoom: number): number {
  return Math.max(9 / zoom, 70);
}

export function MapCanvas({
  nodes,
  maxNeighborDistance,
  selectedIndex,
  camera,
  tool,
  onCameraChange,
  onSelect,
  onMoveNode,
  onAddNode,
  onViewportChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const dragRef = useRef<{
    kind: "pan" | "node";
    index?: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        const next = { width: rect.width, height: rect.height };
        setSize(next);
        onViewportChange?.(next);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onViewportChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const edges = useMemo(
    () => buildEdges(nodes, maxNeighborDistance),
    [nodes, maxNeighborDistance],
  );

  const grid = useMemo(() => {
    if (nodes.length === 0) return { xs: [] as number[], ys: [] as number[] };
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.floor((Math.min(...xs) - 2000) / 1000) * 1000;
    const maxX = Math.ceil((Math.max(...xs) + 2000) / 1000) * 1000;
    const minY = Math.floor((Math.min(...ys) - 2000) / 1000) * 1000;
    const maxY = Math.ceil((Math.max(...ys) + 2000) / 1000) * 1000;
    const xLines: number[] = [];
    const yLines: number[] = [];
    for (let x = minX; x <= maxX; x += 1000) xLines.push(x);
    for (let y = minY; y <= maxY; y += 1000) yLines.push(y);
    return { xs: xLines, ys: yLines, minX, maxX, minY, maxY };
  }, [nodes]);

  const toClient = (event: PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const hitTest = (sx: number, sy: number): number | null => {
    let best: number | null = null;
    let bestDist = Infinity;
    const r = nodeRadius(camera.zoom) * camera.zoom * 1.2;
    nodes.forEach((node, index) => {
      const { wx, wy } = mapToWorld(node.x, node.y);
      const rad = (camera.rotation * Math.PI) / 180;
      const rx = wx * Math.cos(rad) - wy * Math.sin(rad);
      const ry = wx * Math.sin(rad) + wy * Math.cos(rad);
      const nsx = camera.panX + rx * camera.zoom;
      const nsy = camera.panY + ry * camera.zoom;
      const dist = Math.hypot(nsx - sx, nsy - sy);
      if (dist < r && dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    return best;
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const { x, y } = toClient(event);
    const hit = hitTest(x, y);
    const pan =
      tool === "pan" || spaceDown || event.button === 1 || event.button === 2;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pan) {
      dragRef.current = { kind: "pan", lastX: event.clientX, lastY: event.clientY };
      return;
    }
    if (tool === "add" && hit === null) {
      const map = screenToMap(x, y, camera);
      onAddNode(Math.round(map.x), Math.round(map.y));
      return;
    }
    if (hit !== null) {
      onSelect(hit);
      dragRef.current = {
        kind: "node",
        index: hit,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      return;
    }
    onSelect(null);
    dragRef.current = { kind: "pan", lastX: event.clientX, lastY: event.clientY };
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind === "pan") {
      onCameraChange({
        ...camera,
        panX: camera.panX + (event.clientX - drag.lastX),
        panY: camera.panY + (event.clientY - drag.lastY),
      });
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      return;
    }
    if (drag.kind === "node" && drag.index !== undefined) {
      const { x, y } = toClient(event);
      const map = screenToMap(x, y, camera);
      const step = event.shiftKey ? 50 : 1;
      onMoveNode(drag.index, snap(map.x, step), snap(map.y, step));
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const { x, y } = (() => {
      const rect = event.currentTarget.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    })();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    onCameraChange(zoomAt(camera, x, y, factor));
  };

  const r = nodeRadius(camera.zoom);
  const stroke = Math.max(1.2 / camera.zoom, 12);
  const font = Math.max(11 / camera.zoom, 90);

  const gTransform = `translate(${camera.panX} ${camera.panY}) rotate(${camera.rotation}) scale(${camera.zoom})`;

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <svg
        className={`map-svg tool-${spaceDown ? "pan" : tool}`}
        width={size.width}
        height={size.height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#7dd3fc" />
          </marker>
        </defs>
        <rect width={size.width} height={size.height} className="map-bg" />
        <g transform={gTransform}>
          {grid.maxX !== undefined ? (
            <g className="grid">
              {grid.xs.map((x) => {
                const a = mapToWorld(x, grid.minY!);
                const b = mapToWorld(x, grid.maxY!);
                return (
                  <line
                    key={`x-${x}`}
                    x1={a.wx}
                    y1={a.wy}
                    x2={b.wx}
                    y2={b.wy}
                    strokeWidth={stroke * 0.35}
                  />
                );
              })}
              {grid.ys.map((y) => {
                const a = mapToWorld(grid.minX!, y);
                const b = mapToWorld(grid.maxX!, y);
                return (
                  <line
                    key={`y-${y}`}
                    x1={a.wx}
                    y1={a.wy}
                    x2={b.wx}
                    y2={b.wy}
                    strokeWidth={stroke * 0.35}
                  />
                );
              })}
            </g>
          ) : null}

          {edges.map((edge) => {
            const from = nodes[edge.fromIndex];
            const to = nodes[edge.toIndex];
            const a = mapToWorld(from.x, from.y);
            const b = mapToWorld(to.x, to.y);
            const dx = b.wx - a.wx;
            const dy = b.wy - a.wy;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const start = { x: a.wx + ux * r, y: a.wy + uy * r };
            const end = { x: b.wx - ux * r * 1.15, y: b.wy - uy * r * 1.15 };
            return (
              <line
                key={`${edge.fromIndex}-${edge.toIndex}-${edge.direction}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                className="edge"
                strokeWidth={stroke}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {nodes.map((node, index) => {
            const { wx, wy } = mapToWorld(node.x, node.y);
            const selected = index === selectedIndex;
            const dirs: Direction[] = node.directions ?? ["North", "South", "East", "West"];
            return (
              <g key={`${node.x}-${node.y}-${index}`} transform={`translate(${wx} ${wy})`}>
                <circle
                  r={r}
                  className={
                    selected
                      ? "node selected"
                      : node.charger
                        ? "node charger"
                        : node.chute
                          ? "node chute"
                          : "node"
                  }
                  strokeWidth={stroke}
                />
                {dirs.map((dir) => {
                  const delta = DIRECTION_DELTA[dir];
                  const tip = mapToWorld(delta.dx, delta.dy);
                  const mag = Math.hypot(tip.wx, tip.wy) || 1;
                  const nx = (tip.wx / mag) * (r + 55);
                  const ny = (tip.wy / mag) * (r + 55);
                  return (
                    <line
                      key={dir}
                      x1={(tip.wx / mag) * r * 0.2}
                      y1={(tip.wy / mag) * r * 0.2}
                      x2={nx}
                      y2={ny}
                      className="dir-tick"
                      strokeWidth={stroke * 0.8}
                    />
                  );
                })}
                {node.charger ? (
                  <g
                    transform={`rotate(${directionAngle(node.charger.direction)}) translate(${r + 90} 0)`}
                    className="charger-mark"
                  >
                    <rect x={-50} y={-28} width={100} height={56} rx={8} />
                    <text fontSize={font * 0.55} textAnchor="middle" dy="0.35em">
                      CHG
                    </text>
                  </g>
                ) : null}
                {node.chute ? (
                  <g
                    transform={`rotate(${directionAngle(node.chute.direction)}) translate(${r + 90} 0)`}
                    className="chute-mark"
                  >
                    <polygon points="60,0 -40,-40 -40,40" />
                  </g>
                ) : null}
                <g transform={`rotate(${-camera.rotation})`}>
                  <text className="node-label" fontSize={font} textAnchor="middle" dy="-0.15em">
                    {node.name ?? node.code}
                  </text>
                  {node.name ? (
                    <text className="node-sub" fontSize={font * 0.7} textAnchor="middle" dy="1.1em">
                      {node.code}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}
        </g>
        <Compass rotation={camera.rotation} />
      </svg>
    </div>
  );
}

function Compass({ rotation }: { rotation: number }) {
  return (
    <g className="compass" transform="translate(56 56)">
      <circle r="36" />
      <g transform={`rotate(${rotation})`}>
        <polygon points="0,-28 8,16 -8,16" />
        <text y="-38" textAnchor="middle">
          N
        </text>
      </g>
    </g>
  );
}
