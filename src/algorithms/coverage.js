export const TYPES = {
  basic: { label: 'Indoor Basic', radius: 20, hardware: 100, outdoor: false },
  pro: { label: 'Indoor Pro', radius: 30, hardware: 180, outdoor: false },
  standard: { label: 'Outdoor Standard', radius: 50, hardware: 300, outdoor: true },
  long: { label: 'Outdoor Long-Range', radius: 80, hardware: 500, outdoor: true }
};
export const METERS_PER_MAP_UNIT = 0.5;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function getCost(ap, core) {
  const spec = TYPES[ap.type] || TYPES.basic;
  return spec.hardware + Math.hypot(ap.x - core.x, ap.y - core.y) * METERS_PER_MAP_UNIT * 1.8;
}

function insideRect(x, y, b) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
function blocked(x1, y1, x2, y2, buildings) {
  const steps = 12;
  let hits = 0;
  // Indoor APs and indoor receivers are already inside their endpoint buildings; only walls
  // crossed between endpoints add path loss.
  const endpointBuildings = new Set(buildings.filter(b => insideRect(x1, y1, b) || insideRect(x2, y2, b)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    if (buildings.some(b => !endpointBuildings.has(b) && insideRect(x, y, b))) hits++;
  }
  return hits;
}

export function signalStrength(ap, x, y, buildings) {
  const d = Math.hypot(ap.x - x, ap.y - y) * METERS_PER_MAP_UNIT;
  const spec = TYPES[ap.type] || TYPES.basic;
  if (d > spec.radius * 1.55) return 0;
  const attenuation = Math.pow(0.56, blocked(ap.x, ap.y, x, y, buildings));
  return clamp((1 - d / (spec.radius * 1.55)) * attenuation, 0, 1);
}

// Each cell receives a decaying signal from every working AP. Building walls add path loss.
export function computeCoverage(campus, aps, core, time = 12, resolution = 10) {
  const step = Math.max(5, resolution) / METERS_PER_MAP_UNIT, cells = [];
  let totalWeight = 0, coveredWeight = 0, covered = 0, signalSum = 0, redundants = 0;
  const live = aps.filter(a => !a.failed);
  for (let y = step / 2; y < 600; y += step) for (let x = step / 2; x < 1000; x += step) {
    const building = campus.buildings.find(b => insideRect(x, y, b));
    const peak = (building?.density || 0.18) * (building ? timeFactor(building.name, time) : 1);
    const signals = live.map(ap => signalStrength(ap, x, y, campus.buildings)).sort((a, b) => b - a);
    const sig = signals[0] || 0, isCovered = sig >= 0.22;
    totalWeight += peak; if (isCovered) { covered++; coveredWeight += peak; signalSum += sig; }
    if (signals.filter(s => s >= 0.22).length > 1) redundants++;
    cells.push({ x, y, signal: sig, weight: peak });
  }
  const costs = aps.reduce((sum, a) => sum + getCost(a, core), 0);
  const overlap = live.length ? redundants / cells.length * 100 : 0;
  const coverage = cells.length ? covered / cells.length * 100 : 0;
  const weighted = totalWeight ? coveredWeight / totalWeight * 100 : 0;
  const avg = covered ? signalSum / covered : 0;
  const efficiency = clamp(Math.round(weighted * 0.64 + avg * 100 * 0.20 + (1 - Math.min(costs / 5000, 1)) * 16), 0, 100);
  return { cells, coverage, weighted, covered, dead: cells.length - covered, redundancy: overlap, cost: costs, avgSignal: avg * 100, efficiency, maxUsers: live.length * 120, totalCells: cells.length };
}

export function timeFactor(name, time) {
  const hour = Number(time);
  if (name.toLowerCase().includes('canteen')) return hour >= 11 && hour <= 14 ? 1.8 : 0.6;
  if (name.toLowerCase().includes('hostel')) return hour >= 19 ? 1.8 : 0.7;
  if (name.toLowerCase().includes('library')) return hour >= 9 && hour <= 17 ? 1.35 : 0.55;
  return hour >= 9 && hour <= 16 ? 1.25 : 0.62;
}

export function assignChannels(aps) {
  const colors = { 1: '#59c9ff', 6: '#ffc44e', 11: '#d07aff' };
  return aps.map((ap, i) => {
    const used = aps.slice(0, i).filter(other => Math.hypot(ap.x - other.x, ap.y - other.y) * METERS_PER_MAP_UNIT < (TYPES[ap.type]?.radius || 30) + (TYPES[other.type]?.radius || 30)).map(other => other.channel);
    const channel = [1, 6, 11].find(ch => !used.includes(ch)) || [1, 6, 11][i % 3];
    return { ...ap, channel, channelColor: colors[channel] };
  });
}
