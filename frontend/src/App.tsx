import { useCallback, useEffect, useRef, useState } from "react";
import type { MapNode } from "@shared/types";
import { fetchMap, saveMap } from "./api";
import { MapCanvas } from "./components/MapCanvas";
import { NodeInspector } from "./components/NodeInspector";
import { Toolbar, type Tool } from "./components/Toolbar";
import { type Camera, fitCamera, rotateAround, zoomAt } from "./lib/coords";
import "./styles.css";

const MAP_ID = "example";

export default function App() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [maxNeighborDistance, setMaxNeighborDistance] = useState(1500);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [camera, setCamera] = useState<Camera>({ panX: 0, panY: 0, zoom: 0.1, rotation: 0 });
  const [tool, setTool] = useState<Tool>("select");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Loading map…");
  const [error, setError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const fittedRef = useRef(false);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await fetchMap(MAP_ID);
        if (cancelled) return;
        setNodes(stored.map.nodes);
        setMaxNeighborDistance(stored.map.maxNeighborDistance);
        setStatus(`Loaded ${MAP_ID} · ${stored.map.nodes.length} nodes`);
        setDirty(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load map");
          setStatus("Load failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fit = useCallback(
    (list = nodes) => {
      const host = document.querySelector(".canvas-wrap");
      const width = host?.clientWidth ?? canvasSize.width;
      const height = host?.clientHeight ?? canvasSize.height;
      setCanvasSize({ width, height });
      setCamera(fitCamera(list, width, height));
    },
    [nodes, canvasSize.width, canvasSize.height],
  );

  useEffect(() => {
    if (nodes.length > 0 && !fittedRef.current) {
      fittedRef.current = true;
      fit(nodes);
    }
  }, [nodes, fit]);

  const selected = selectedIndex !== null ? nodes[selectedIndex] ?? null : null;

  const updateNode = (index: number, node: MapNode) => {
    setNodes((prev) => prev.map((item, i) => (i === index ? node : item)));
    markDirty();
  };

  const addNode = (x: number, y: number) => {
    const occupied = nodes.some((n) => n.x === x && n.y === y);
    const node: MapNode = {
      x: occupied ? x + 100 : x,
      y,
      code: Number(`${Math.abs(x)}${Math.abs(y)}`.slice(0, 10)),
      directions: ["North", "South", "East", "West"],
    };
    setNodes((prev) => {
      const next = [...prev, node];
      setSelectedIndex(next.length - 1);
      return next;
    });
    setTool("select");
    markDirty();
  };

  const deleteSelected = () => {
    if (selectedIndex === null) return;
    setNodes((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
    markDirty();
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveMap(MAP_ID, { map: { maxNeighborDistance, nodes } });
      setDirty(false);
      setStatus(`Saved ${MAP_ID} · ${nodes.length} nodes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
          return;
        }
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex]);

  return (
    <div className="app">
      <Toolbar
        tool={tool}
        onTool={setTool}
        onFit={() => fit()}
        onRotate={(delta) =>
          setCamera((cam) => rotateAround(cam, canvasSize.width / 2, canvasSize.height / 2, delta))
        }
        onResetRotation={() =>
          setCamera((cam) => rotateAround(cam, canvasSize.width / 2, canvasSize.height / 2, -cam.rotation))
        }
        onZoom={(factor) =>
          setCamera((cam) => zoomAt(cam, canvasSize.width / 2, canvasSize.height / 2, factor))
        }
        onSave={onSave}
        saving={saving}
        dirty={dirty}
      />
      <div className="workspace">
        <MapCanvas
          nodes={nodes}
          maxNeighborDistance={maxNeighborDistance}
          selectedIndex={selectedIndex}
          camera={camera}
          tool={tool}
          onCameraChange={setCamera}
          onSelect={setSelectedIndex}
          onMoveNode={(index, x, y) => updateNode(index, { ...nodes[index], x, y })}
          onAddNode={addNode}
          onViewportChange={setCanvasSize}
        />
        <NodeInspector
          node={selected}
          maxNeighborDistance={maxNeighborDistance}
          onChangeMaxDistance={(value) => {
            if (Number.isFinite(value) && value > 0) {
              setMaxNeighborDistance(value);
              markDirty();
            }
          }}
          onChange={(node) => {
            if (selectedIndex !== null) updateNode(selectedIndex, node);
          }}
          onDelete={deleteSelected}
        />
      </div>
      <footer className="statusbar">
        <span>{status}</span>
        <span>
          Wheel zoom · drag empty space to pan · drag nodes to move · Shift snaps 50 mm · Right-click pan
        </span>
        {error ? <span className="error">{error}</span> : <span>{dirty ? "Unsaved changes" : "In sync"}</span>}
      </footer>
    </div>
  );
}
