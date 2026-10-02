# SignalForge

**Campus Wi-Fi Access Point Placement Optimizer** — an offline-first Design & Analysis of Algorithms demo that applies greedy budgeted maximum coverage to a campus Wi-Fi planning problem.

## Run it

Requires Node.js 20 or newer and npm. The app uses plain browser JavaScript and has no package dependencies.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:4173`). `npm run build` copies the static app to `dist`; serve it with `npm run preview`.

## Demo access

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | Full console access |
| `engineer` | `eng123` | Can edit the map and optimize |
| `viewer` | `view123` | Read-only exploration |

These credentials are for a local demo only. The app has no backend or production authentication.

## Problem and approach

A planner has a limited number of APs and a finite budget. SignalForge represents the campus as density-weighted buildings and a 10 m spatial grid. AP signal decays with distance; line-of-sight paths crossing buildings lose signal. An AP's installed cost is its hardware price plus $1.80 per map meter of cable to the core switch. Metrics recalculate from the current layout and time-of-day demand.

### Optimizers

- **Greedy Max-Coverage (main DAA algorithm)** precomputes each candidate's covered-cell mask, then repeatedly adds the affordable AP with the greatest newly covered demand per installed dollar. Its selection phase uses an uncovered-cell set, so overlapping APs do not double-count coverage.
- **Genetic Algorithm** evolves candidate AP layouts with elitism, crossover and mutation. Fitness rewards weighted coverage and penalizes budget overrun.
- **Simulated Annealing** perturbs a layout and occasionally accepts a lower-scoring move early in the search to escape local optima; its acceptance temperature cools over iterations.

The greedy algorithm ranks candidates using the full 10 m demand grid. The built-in **Design & Analysis of Algorithms** panel explains the problem, pseudocode, measured candidate/cell work, the submodular coverage property, memory use, and the guarantee boundary. With C candidate sites, G grid cells, K APs, B buildings, and L ray samples, greedy precomputation takes O(C·G·B·L), selection takes O(K·C·(G+K)), and its coverage-mask storage takes O(C·G). For equal-cost APs under only a cardinality limit, classic greedy maximum coverage has the 1−1/e approximation guarantee; the cost-density, budget-constrained variant used here does not claim that bound. The comparison view benchmarks greedy, genetic search, and simulated annealing against the same campus, AP limit, budget and allowed hardware. Optimization animation reveals the plan progressively.

## Features

- SCADA-inspired responsive control room, animated radar login, dark and blueprint themes, role-aware controls, guided tour and keyboard help.
- Canvas campus map with Small, Medium and Large presets, random campus generation, movable buildings, AP placement and core switch positioning. Select the AP profile for manual placements and restrict hardware profiles for optimization.
- DAA teaching panel with greedy pseudocode, invariant/correctness intuition, measured operation counts, time and space complexity, and a precise approximation-guarantee caveat.
- Heatmap and live metrics for physical and density-weighted coverage, dead cells, redundancy, signal strength, estimated user capacity, cost, and an efficiency score.
- Indoor Basic, Indoor Pro, Outdoor Standard and Outdoor Long-Range APs, cabling cost estimate, simulated failed APs, channel assignment and interference warning.
- Animated simulated users, demand slider, optimizer controls, algorithm benchmark and AP failure actions.
- Undo/redo, named local scenarios, JSON/CSV exports, PNG map snapshot and printable bill of materials report.

## Notes and assumptions

- This is a self-contained browser demo. Layouts and scenarios are stored in this browser's `localStorage`; clearing site data clears them.
- The 1000 × 600 canvas represents a 500 m × 300 m campus. Coverage and cable costs use meter-scaled coordinates, sampled in 10 m cells.
- Building density is a relative device-demand weight. Time-of-day effects are representative demo multipliers, not measured occupancy.
- Users can move buildings in edit mode and add one with a double-click. The UI keeps a focused editor interaction to avoid a heavy CAD dependency.
- Channel choices use 1, 6, and 11, with a proximity-based assignment heuristic. Capacity is an illustrative estimate of 120 concurrent clients per working AP.
- Heatmap colors show the strongest AP signal per cell: green strong, yellow medium, red weak, and background for dead zones.
- **Screenshots:** add presentation screenshots here after launching the app. No screenshot assets were included in this source-only workspace.

## Project structure

```text
src/
  algorithms/coverage.js   Grid coverage, attenuation, costs and channels
  algorithms/optimize.js   Greedy, genetic and simulated annealing solvers
  main.js                  Login, dashboard, canvas and interactions
  style.css                Responsive industrial control-room theme
index.html
```
