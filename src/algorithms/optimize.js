import { TYPES, getCost, computeCoverage, signalStrength } from './coverage.js';

const candidates = (campus, allowed, spacing = 78) => {
  const types = allowed.length ? allowed : Object.keys(TYPES), out = [];
  for (let y = 35; y < 590; y += spacing) for (let x = 35; x < 990; x += spacing) {
    const inside = campus.buildings.some(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    const preferred = inside ? 'pro' : 'standard';
    const type = types.includes(preferred) ? preferred : types[0];
    out.push({ x, y, type });
  }
  return out;
};

/**
 * Greedy budgeted maximum coverage.
 * First precompute each candidate AP's covered-cell mask. At each round, select
 * the affordable candidate with the largest uncovered demand gain per dollar.
 * The saved mask union means coverage is never counted twice.
 */
export function greedy(campus, core, limit, budget, allowed = Object.keys(TYPES), time = 12) {
  const pool = candidates(campus, allowed), cells = computeCoverage(campus, [], core, time).cells;
  const totalWeight = cells.reduce((sum, cell) => sum + cell.weight, 0);
  if (limit <= 0 || budget <= 0) return { aps: [], score: 0, history: [0], analysis: { candidateCount: pool.length, cellCount: cells.length, rounds: 0, precomputeChecks: 0, selectionChecks: 0, matrixCells: 0, preprocessingOrder: 'C × G × B × L', selectionOrder: 'K × C × (G + K)', totalOrder: 'CGBL + KC(G + K)' } };
  let precomputeChecks = 0, selectionChecks = 0;
  const masks = pool.map(ap => {
    const mask = new Uint8Array(cells.length);
    for (let i = 0; i < cells.length; i++) {
      precomputeChecks++;
      mask[i] = signalStrength(ap, cells[i].x, cells[i].y, campus.buildings) >= 0.22 ? 1 : 0;
    }
    return mask;
  });

  const chosen = [], selected = new Set(), covered = new Uint8Array(cells.length), history = [];
  let coveredWeight = 0, installedCost = 0;
  for (let round = 0; round < limit; round++) {
    let bestIndex = -1, bestDensity = 0, bestGain = 0;
    for (let ci = 0; ci < pool.length; ci++) {
      if (selected.has(ci) || chosen.some(ap => Math.hypot(ap.x - pool[ci].x, ap.y - pool[ci].y) < 24)) continue;
      const apCost = getCost(pool[ci], core);
      if (installedCost + apCost > budget) continue;
      let marginalWeight = 0;
      for (let cell = 0; cell < cells.length; cell++) {
        selectionChecks++;
        if (!covered[cell] && masks[ci][cell]) marginalWeight += cells[cell].weight;
      }
      const density = marginalWeight / apCost;
      if (density > bestDensity) { bestIndex = ci; bestDensity = density; bestGain = marginalWeight; }
    }
    if (bestIndex < 0 || bestGain <= 0) break;
    const ap = { ...pool[bestIndex], id: `g${round}` }, mask = masks[bestIndex];
    selected.add(bestIndex); chosen.push(ap); installedCost += getCost(ap, core); coveredWeight += bestGain;
    for (let cell = 0; cell < cells.length; cell++) if (mask[cell]) covered[cell] = 1;
    history.push(totalWeight ? coveredWeight / totalWeight * 100 : 0);
  }

  return {
    aps: chosen, score: history.at(-1) || 0, history,
    analysis: {
      candidateCount: pool.length, cellCount: cells.length, rounds: chosen.length,
      precomputeChecks, selectionChecks, matrixCells: pool.length * cells.length,
      preprocessingOrder: 'C × G × B × L', selectionOrder: 'K × C × (G + K)', totalOrder: 'CGBL + KC(G + K)'
    }
  };
}

// Genetic search evolves AP coordinate/type chromosomes with elitism, crossover and mutation.
export function genetic(campus, core, limit, budget, allowed = Object.keys(TYPES), time = 12, iterations = 12) {
  const pool = candidates(campus, allowed), rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const make = () => {
    const group = [];
    for (let i = 0; i < limit; i++) {
      const currentCost = group.reduce((sum, ap) => sum + getCost(ap, core), 0);
      const affordable = pool.filter(ap => currentCost + getCost(ap, core) <= budget);
      if (!affordable.length) break;
      group.push({ ...rand(affordable) });
    }
    return group;
  };
  const fitness = group => {
    const cost = group.reduce((sum, ap) => sum + getCost(ap, core), 0);
    const cov = computeCoverage(campus, group, core, time, 18).weighted;
    return cov - Math.max(0, cost - budget) / Math.max(budget, 1) * 55 - Math.max(0, cost / Math.max(budget, 1) - 0.82) * 8;
  };
  let pop = Array.from({ length: 10 }, make), history = [];
  for (let it = 0; it < iterations; it++) {
    pop.sort((a, b) => fitness(b) - fitness(a)); history.push(Math.max(0, fitness(pop[0])));
    const next = [pop[0], pop[1]];
    while (next.length < pop.length) {
      const a = rand(pop.slice(0, 8)), b = rand(pop.slice(0, 8));
      const child = a.map((gene, i) => Math.random() < 0.5 ? { ...gene } : { ...(b[i] || gene) });
      if (child.length && Math.random() < 0.72) child[Math.floor(Math.random() * child.length)] = { ...rand(pool) };
      next.push(child);
    }
    pop = next;
  }
  pop.sort((a, b) => fitness(b) - fitness(a));
  const aps = pop[0].map((ap, i) => ({ ...ap, id: `ga${i}` }));
  while (aps.length && aps.reduce((sum, ap) => sum + getCost(ap, core), 0) > budget) aps.pop();
  return { aps, score: computeCoverage(campus, aps, core, time, 10).weighted, history };
}

// Simulated annealing perturbs a layout and cools its acceptance probability over time.
export function anneal(campus, core, limit, budget, allowed = Object.keys(TYPES), time = 12, iterations = 20) {
  const pool = candidates(campus, allowed), rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const make = () => {
    const group = [];
    for (let i = 0; i < limit; i++) {
      const currentCost = group.reduce((sum, ap) => sum + getCost(ap, core), 0);
      const affordable = pool.filter(ap => currentCost + getCost(ap, core) <= budget);
      if (!affordable.length) break;
      group.push({ ...rand(affordable) });
    }
    return group;
  };
  const fitness = group => {
    const cost = group.reduce((sum, ap) => sum + getCost(ap, core), 0);
    return computeCoverage(campus, group, core, time, 18).weighted - Math.max(0, cost - budget) / Math.max(1, budget) * 50;
  };
  let current = make(), score = fitness(current), best = current, bestScore = score, history = [];
  for (let i = 0; i < iterations; i++) {
    const next = current.map(ap => ({ ...ap })), idx = Math.floor(Math.random() * next.length), candidate = rand(pool);
    if (next.length) next[idx] = { ...candidate };
    const nextScore = fitness(next), temperature = 12 * (1 - i / iterations) + 0.2;
    if (nextScore > score || Math.random() < Math.exp((nextScore - score) / temperature)) { current = next; score = nextScore; }
    if (score > bestScore) { best = current; bestScore = score; }
    history.push(Math.max(0, bestScore));
  }
  const aps = best.map((ap, i) => ({ ...ap, id: `sa${i}` }));
  while (aps.length && aps.reduce((sum, ap) => sum + getCost(ap, core), 0) > budget) aps.pop();
  return { aps, score: computeCoverage(campus, aps, core, time, 10).weighted, history };
}

export function compare(campus, core, limit, budget, allowed, time = 12) {
  return [ ['Greedy Max-Coverage', greedy], ['Genetic Algorithm', genetic], ['Simulated Annealing', anneal] ].map(([name, fn]) => {
    const start = performance.now(), result = fn(campus, core, limit, budget, allowed, time);
    const runtime = Math.max(1, Math.round(performance.now() - start));
    return { name, ...result, runtime, cost: result.aps.reduce((sum, ap) => sum + getCost(ap, core), 0) };
  });
}
