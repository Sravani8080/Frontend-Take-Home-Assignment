# AGV Map Editor (Mujin Frontend Challenge)

React + TypeScript map editor for warehouse AGV graphs, with a REST API, automated tests, and a `debian:bullseye` Docker image.

## Features

- Load and save the challenge map format (`x`, `y`, `code`, `directions`, `charger`, `chute`, `name`)
- Axis-aligned connections only (same X or same Y), using `maxNeighborDistance` and nearest-neighbor edges
- Coordinate convention from the spec: **North = +X**, **West = +Y**
- Edit node properties, add nodes, delete nodes, drag nodes (Shift snaps to 50 mm)
- Zoom (mouse wheel), pan (drag empty space / Pan tool / right-click), rotate the view
- REST API with JSON file persistence

## Quick start (Docker)

Build and run:

```bash
docker build -t agv-map-editor .
docker run --rm -p 8080:8080 agv-map-editor
```

Open http://localhost:8080

Push to Docker Hub (replace `YOUR_USER`):

```bash
docker tag agv-map-editor YOUR_USER/agv-map-editor:latest
docker push YOUR_USER/agv-map-editor:latest
```

Then others can run:

```bash
docker run --rm -p 8080:8080 YOUR_USER/agv-map-editor:latest
```

## Local development

Requires Node.js 20+.

```bash
npm install
npm test
npm run dev
```

- UI: http://localhost:5173 (Vite proxies `/api` to the backend)
- API: http://localhost:8080

Production-style local run:

```bash
npm run build
npm start
```

Then open http://localhost:8080

## Tests

```bash
npm test
```

This runs:

- Backend: Zod schema validation and REST CRUD tests (`backend/src/*.test.ts`) plus graph tests (`shared/graph.test.ts`)
- Frontend: camera/coordinate tests and Node inspector tests

## REST API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/maps` | List maps (`id`, `updatedAt`, `nodeCount`) |
| GET | `/api/maps/:id` | Fetch a map document |
| POST | `/api/maps` | Create a map from `{ "map": { ... } }` |
| PUT | `/api/maps/:id` | Create or replace a map |
| DELETE | `/api/maps/:id` | Delete a map |

The editor uses map id `example`, seeded from `data/example-map.json` on first start.

Example save body:

```json
{
  "map": {
    "maxNeighborDistance": 1500,
    "nodes": [
      { "x": 1000, "y": 1000, "code": 10001000, "directions": ["North"] }
    ]
  }
}
```

Validation rules:

- `x`, `y`, `code` are integers
- `(x, y)` pairs are unique
- `directions`, charger plug, and chute ejection use `North | South | East | West`
- If `directions` is omitted, travel is allowed toward every connected neighbor

## Map connectivity

Two nodes are neighbors when:

1. They share an X **or** a Y (never diagonal)
2. Their axis distance is ≤ `maxNeighborDistance`
3. No other node lies strictly between them on that axis

Travel arrows follow each node’s `directions`. A charger’s `direction` is the plug facing; the AGV reverses into it. A chute’s `direction` is the payload ejection travel.

## Project layout

```
backend/     Express + Zod API
frontend/     Vite + React + TypeScript editor
shared/       Map types and graph helpers
data/         Example map and persisted JSON maps
```

## Notes for reviewers

The Docker image starts from `debian:bullseye`, installs Node 20, runs the test suite during build, compiles the UI and API, and serves both on port 8080.
