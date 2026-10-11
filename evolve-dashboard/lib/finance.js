import { company, fleetPlan, routes } from "./data";

export function totalCapex(capex) {
  return capex.reduce((s, c) => s + c.qty * c.unitCost, 0);
}

function capexOf(capex, key) {
  const item = capex.find((c) => c.key === key);
  return item ? item.qty * item.unitCost : 0;
}

const baseFleet = fleetPlan[0];
const addedFleet = fleetPlan[fleetPlan.length - 1] - baseFleet;
const fleetAt = (year) => fleetPlan[Math.min(year, fleetPlan.length - 1)];

/**
 * Yearly cash flows of the scale-up (the 9,500 additional units only).
 * Capital is released phase by phase, in proportion to the units each phase adds.
 */
export function cashflows(a, rentalFee = a.rentalFee) {
  const total = totalCapex(a.capex);
  const batteryCapex = capexOf(a.capex, "battery");
  const flows = [];
  let cumulative = 0;
  for (let year = 0; year <= a.horizonYears; year++) {
    const capex = year < fleetPlan.length - 1 ? (total * (fleetAt(year + 1) - fleetAt(year))) / addedFleet : 0;
    const units = year === 0 ? 0 : (fleetAt(year - 1) + fleetAt(year)) / 2 - baseFleet;
    const revenue = units * (rentalFee + a.serviceFee) * a.operatingDays;
    const opex = revenue * a.opexShare;
    const recovery = year === a.horizonYears ? batteryCapex * a.salvageShare : 0;
    const net = revenue - opex + recovery - capex;
    cumulative += net;
    flows.push({ year, fleet: fleetAt(year), capex, revenue, opex, recovery, net, cumulative });
  }
  return flows;
}

export function npv(flows, rate) {
  return flows.reduce((s, f) => s + f.net / Math.pow(1 + rate, f.year), 0);
}

/** Internal rate of return by bisection; null when it does not exist in (−99%, 100%). */
export function irr(flows) {
  let lo = -0.99;
  let hi = 1;
  let fLo = npv(flows, lo);
  const fHi = npv(flows, hi);
  if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(flows, mid);
    if (fLo * fMid <= 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** Years until cumulative cash flow turns positive; null if it never does. */
export function payback(flows) {
  for (let i = 1; i < flows.length; i++) {
    const prev = flows[i - 1].cumulative;
    const cur = flows[i].cumulative;
    if (prev < 0 && cur >= 0) return flows[i - 1].year + -prev / (cur - prev);
  }
  return null;
}

/**
 * Lowest rental fee that recovers PT RES's battery investment:
 * an annuity on the battery cost per vehicle at the discount rate,
 * less the recovery value expected at end of life, plus daily battery operations.
 */
export function minRentalFee(a) {
  const perVehicle = capexOf(a.capex, "battery") / addedFleet;
  const r = a.discountRate;
  const n = a.horizonYears;
  const annuity = r === 0 ? perVehicle / n : (perVehicle * r) / (1 - Math.pow(1 + r, -n));
  const recovery = perVehicle * a.salvageShare;
  const recoveryPerYear = r === 0 ? recovery / n : (recovery * r) / (Math.pow(1 + r, n) - 1);
  return Math.max(0, (annuity - recoveryPerYear) / a.operatingDays + a.batteryOpexPerDay);
}

/** Maximum Rental Fee = Daily Driver Revenue − Operating Costs − Rp100,000 */
export function maxRentalFee(driver, a) {
  return driver.revenue - driver.energy - driver.other - a.serviceFee - company.incomeFloor;
}

export function netIncome(driver, a, rentalFee = a.rentalFee) {
  return driver.revenue - driver.energy - driver.other - a.serviceFee - rentalFee;
}

/** Network-average driver, weighted by the units planned on each route. */
export function averageDriver() {
  const w = routes.reduce((s, r) => s + r.planned, 0);
  const avg = (key) => routes.reduce((s, r) => s + r[key] * r.planned, 0) / w;
  return { revenue: avg("revenue"), energy: avg("energy"), other: avg("other") };
}

/** Route Investment Pool score (0–100) from demand, utilisation and driver margin. */
export function scoreRoutes(weights) {
  const total = weights.demand + weights.util + weights.margin || 1;
  const maxPax = Math.max(...routes.map((r) => r.pax));
  const maxUtil = Math.max(...routes.map((r) => r.util));
  const margin = (r) => r.revenue - r.energy - r.other;
  const maxMargin = Math.max(...routes.map(margin));
  const scored = routes
    .map((r) => ({
      ...r,
      score:
        (100 * (weights.demand * (r.pax / maxPax) + weights.util * (r.util / maxUtil) + weights.margin * (margin(r) / maxMargin))) /
        total,
    }))
    .sort((x, y) => y.score - x.score);
  // Fund routes in score order until each phase's fleet target is reached.
  let running = 0;
  return scored.map((r, i) => {
    running += r.planned;
    const phase = running <= fleetPlan[1] + 200 ? 1 : running <= fleetPlan[2] + 200 ? 2 : 3;
    return { ...r, rank: i + 1, phase };
  });
}
