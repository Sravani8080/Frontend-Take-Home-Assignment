import type { Direction, MapNode } from "@shared/types";
import { DIRECTIONS } from "@shared/types";

interface Props {
  node: MapNode | null;
  maxNeighborDistance: number;
  onChangeMaxDistance: (value: number) => void;
  onChange: (node: MapNode) => void;
  onDelete: () => void;
}

function toggleDirection(node: MapNode, direction: Direction): Direction[] | undefined {
  const current = node.directions;
  if (current === undefined) {
    return DIRECTIONS.filter((d) => d !== direction);
  }
  if (current.includes(direction)) {
    const next = current.filter((d) => d !== direction);
    return next;
  }
  return [...current, direction];
}

export function NodeInspector({
  node,
  maxNeighborDistance,
  onChangeMaxDistance,
  onChange,
  onDelete,
}: Props) {
  return (
    <aside className="inspector">
      <h2>Map</h2>
      <label className="field">
        <span>Max neighbor distance (mm)</span>
        <input
          type="number"
          min={1}
          value={maxNeighborDistance}
          onChange={(e) => onChangeMaxDistance(Number(e.target.value))}
        />
      </label>
      <p className="hint">
        Nodes connect only when they share an X or Y and are no farther than this distance, with no
        node in between. AGVs cannot travel diagonally.
      </p>

      <h2>Node</h2>
      {!node ? (
        <p className="hint">Select a node to edit its properties, or use Add node and click the map.</p>
      ) : (
        <div className="inspector-form">
          <label className="field">
            <span>Name</span>
            <input
              value={node.name ?? ""}
              placeholder="optional"
              onChange={(e) => {
                const name = e.target.value.trim();
                const next = { ...node };
                if (name) next.name = name;
                else delete next.name;
                onChange(next);
              }}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>X (mm, North +)</span>
              <input
                type="number"
                value={node.x}
                onChange={(e) => onChange({ ...node, x: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>Y (mm, West +)</span>
              <input
                type="number"
                value={node.y}
                onChange={(e) => onChange({ ...node, y: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="field">
            <span>QR code</span>
            <input
              type="number"
              value={node.code}
              onChange={(e) => onChange({ ...node, code: Number(e.target.value) })}
            />
          </label>

          <fieldset className="field">
            <legend>Travel directions</legend>
            <p className="hint compact">
              Unspecified means every direction is allowed. North is +X, West is +Y.
            </p>
            <label className="check">
              <input
                type="checkbox"
                checked={node.directions === undefined}
                onChange={(e) => {
                  const next = { ...node };
                  if (e.target.checked) delete next.directions;
                  else next.directions = [...DIRECTIONS];
                  onChange(next);
                }}
              />
              All directions
            </label>
            {DIRECTIONS.map((direction) => (
              <label key={direction} className="check">
                <input
                  type="checkbox"
                  disabled={node.directions === undefined}
                  checked={node.directions === undefined || node.directions.includes(direction)}
                  onChange={() => {
                    const directions = toggleDirection(node, direction);
                    onChange({ ...node, directions });
                  }}
                />
                {direction}
              </label>
            ))}
          </fieldset>

          <fieldset className="field">
            <legend>Charger</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(node.charger)}
                onChange={(e) => {
                  const next = { ...node };
                  if (e.target.checked) next.charger = { direction: "West" };
                  else delete next.charger;
                  onChange(next);
                }}
              />
              Has charger
            </label>
            {node.charger ? (
              <label className="field">
                <span>Plug points</span>
                <select
                  value={node.charger.direction}
                  onChange={(e) =>
                    onChange({
                      ...node,
                      charger: { direction: e.target.value as Direction },
                    })
                  }
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <p className="hint compact">The AGV backs in opposite the plug direction to charge.</p>
          </fieldset>

          <fieldset className="field">
            <legend>Chute</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(node.chute)}
                onChange={(e) => {
                  const next = { ...node };
                  if (e.target.checked) next.chute = { direction: "North" };
                  else delete next.chute;
                  onChange(next);
                }}
              />
              Has chute
            </label>
            {node.chute ? (
              <label className="field">
                <span>Ejection travel</span>
                <select
                  value={node.chute.direction}
                  onChange={(e) =>
                    onChange({
                      ...node,
                      chute: { direction: e.target.value as Direction },
                    })
                  }
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </fieldset>

          <button type="button" className="danger" onClick={onDelete}>
            Delete node
          </button>
        </div>
      )}
    </aside>
  );
}
