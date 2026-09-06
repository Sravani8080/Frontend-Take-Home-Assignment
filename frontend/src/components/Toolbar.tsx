import type { ReactNode } from "react";

export type Tool = "select" | "add" | "pan";

interface Props {
  tool: Tool;
  onTool: (tool: Tool) => void;
  onFit: () => void;
  onRotate: (delta: number) => void;
  onResetRotation: () => void;
  onZoom: (factor: number) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}

function ToolButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <button type="button" className={active ? "tool active" : "tool"} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export function Toolbar({
  tool,
  onTool,
  onFit,
  onRotate,
  onResetRotation,
  onZoom,
  onSave,
  saving,
  dirty,
}: Props) {
  return (
    <header className="toolbar">
      <div className="brand">
        <strong>AGV Map Editor</strong>
        <span>Mujin challenge</span>
      </div>
      <div className="tool-group" role="group" aria-label="Tools">
        <ToolButton active={tool === "select"} onClick={() => onTool("select")} title="Select and drag nodes">
          Select
        </ToolButton>
        <ToolButton active={tool === "add"} onClick={() => onTool("add")} title="Click the map to add a node">
          Add node
        </ToolButton>
        <ToolButton active={tool === "pan"} onClick={() => onTool("pan")} title="Drag to pan">
          Pan
        </ToolButton>
      </div>
      <div className="tool-group">
        <ToolButton onClick={() => onZoom(1.2)} title="Zoom in">
          Zoom +
        </ToolButton>
        <ToolButton onClick={() => onZoom(1 / 1.2)} title="Zoom out">
          Zoom −
        </ToolButton>
        <ToolButton onClick={onFit} title="Fit map in view">
          Fit
        </ToolButton>
        <ToolButton onClick={() => onRotate(-15)} title="Rotate 15° counter-clockwise">
          Rotate −
        </ToolButton>
        <ToolButton onClick={() => onRotate(15)} title="Rotate 15° clockwise">
          Rotate +
        </ToolButton>
        <ToolButton onClick={onResetRotation} title="Reset rotation">
          North up
        </ToolButton>
      </div>
      <button type="button" className="save" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : dirty ? "Save map" : "Saved"}
      </button>
    </header>
  );
}
