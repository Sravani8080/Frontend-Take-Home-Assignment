import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeInspector } from "../components/NodeInspector";

describe("NodeInspector", () => {
  it("renders empty state when no node is selected", () => {
    render(
      <NodeInspector
        node={null}
        maxNeighborDistance={1500}
        onChangeMaxDistance={() => undefined}
        onChange={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText(/select a node/i)).toBeInTheDocument();
  });

  it("shows charger and chute controls for a fully specified node", () => {
    render(
      <NodeInspector
        node={{
          x: 1000,
          y: 2000,
          code: 42,
          name: "CHRG1",
          directions: ["South"],
          charger: { direction: "West" },
          chute: { direction: "North" },
        }}
        maxNeighborDistance={1500}
        onChangeMaxDistance={() => undefined}
        onChange={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByDisplayValue("CHRG1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("42")).toBeInTheDocument();
    expect(screen.getByLabelText("Has charger")).toBeChecked();
    expect(screen.getByLabelText("Has chute")).toBeChecked();
  });
});
