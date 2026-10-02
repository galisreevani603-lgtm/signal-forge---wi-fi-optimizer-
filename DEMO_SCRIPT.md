# SignalForge — 3-minute judge pitch

## 0:00–0:25 · The problem

“A campus can have hundreds of rooms and outdoor spaces, but the Wi-Fi team has a fixed AP count and budget. A floor-plan guess often leaves crowded zones uncovered or spends money where it adds little value. SignalForge turns AP placement into a visible, measurable optimization problem.”

## 0:25–0:50 · Sign in and orient

Sign in as `admin` / `admin123`. Point out the live operations status, weighted coverage, budget meter, efficiency gauge, and the campus map. Briefly show the guided tour and note that engineer and viewer roles demonstrate edit and read-only access.

## 0:50–1:20 · Model the campus

Choose the Medium campus. Explain that buildings carry relative demand weights and attenuate signal. Toggle the heatmap, move the time slider to lunch, and show how demand weighting shifts. Drag the core switch to demonstrate cabling cost, then place or move an AP and observe the live cost and coverage metrics.

## 1:20–2:05 · Design the greedy algorithm

Open **Design & Analysis of Algorithms**. Frame the problem as weighted maximum coverage with a budget: candidate APs cover demand cells, buildings attenuate signal, and the cost of a candidate includes hardware and cabling. Walk through the pseudocode: precompute coverage masks, find each candidate's uncovered demand per dollar, choose the best feasible AP, then union its cells into the covered set.

Explain the analysis with the live candidate and grid counts. Precomputation is O(C·G·B·L), selection is O(K·C·G), and the mask matrix uses O(C·G) space. Explain diminishing returns: as the covered set grows, each candidate can only add fewer cells. The classic 1−1/e bound applies to equal-cost APs with a count limit; because this demo uses cost-per-gain ranking and a budget, it does not claim that bound for its full variant.

## 2:05–2:35 · Optimize and compare

Set an AP limit and budget, run Greedy Max-Coverage, and point to its measured coverage masks, live fitness and step-by-step deployment. Open Compare to show how genetic search and simulated annealing trade coverage against installed cost and runtime. Apply the best result.

## 2:35–2:50 · Stress-test the plan

Shift-click an AP or use FAIL in its status row. Point out the newly exposed dead zones and reduced coverage. Restore it. Mention simulated device links, channel coloring, and interference warnings as operational signals for the planner.

## 2:50–3:00 · Deliver the plan

Save the layout as a named scenario. Export the AP CSV or JSON, then open the printable report to show the map, headline metrics, and bill of materials. “SignalForge gives the team a plan they can inspect, explain, and hand off—not just a placement guess.”

### Backup demo path

If time is short, sign in, run Greedy with the default budget, open Compare, apply its best result, fail one AP, and generate the report.
