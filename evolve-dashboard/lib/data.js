/*
 * EVOLVE — RES NEXUS data layer.
 *
 * Figures marked "from the case" come from the PT RES business case.
 * Everything else is ILLUSTRATIVE demo data so the dashboard has something
 * to show. Replace it with real figures (or an API call) when available.
 */

// ---- From the case ---------------------------------------------------------
export const company = {
  name: "PT RES",
  pilotFleet: 500,
  targetFleet: 10000,
  horizonMonths: 36,
  costSaving: 0.35, // driver operating cost vs Pertalite, 6-month pilot
  emissionCut: 0.42, // local emissions, 6-month pilot
  incomeFloor: 100000, // driver net income, Rp per day
};

// ---- Illustrative: phased scale-up ------------------------------------------
export const phases = [
  { name: "Pilot", month: 0, fleet: 500, note: "6-month pilot complete" },
  { name: "Phase 1", month: 12, fleet: 2500, note: "Highest-scoring routes" },
  { name: "Phase 2", month: 24, fleet: 6000, note: "Mid-scoring routes" },
  { name: "Phase 3", month: 36, fleet: 10000, note: "Full network" },
];

export const fleetPlan = phases.map((p) => p.fleet);

// ---- Illustrative: routes ----------------------------------------------------
// revenue / energy / other are Rp per driver per day.
// pax = passengers per vehicle per day, util = share of seat-km filled.
export const routes = [
  { id: "K01", name: "Terminal Induk – Pasar Baru", deployed: 90, planned: 1400, pax: 168, util: 0.86, revenue: 520000, energy: 52000, other: 55000, weeksBelow: 0 },
  { id: "K02", name: "Stasiun Kota – Kampus", deployed: 80, planned: 1200, pax: 160, util: 0.83, revenue: 495000, energy: 50000, other: 52000, weeksBelow: 0 },
  { id: "K03", name: "Alun-Alun – Kawasan Industri", deployed: 75, planned: 1100, pax: 151, util: 0.8, revenue: 470000, energy: 54000, other: 50000, weeksBelow: 0 },
  { id: "K04", name: "Terminal Timur – Pelabuhan", deployed: 65, planned: 1000, pax: 142, util: 0.77, revenue: 455000, energy: 51000, other: 50000, weeksBelow: 0 },
  { id: "K05", name: "Pasar Induk – Perumahan Barat", deployed: 60, planned: 950, pax: 133, util: 0.74, revenue: 435000, energy: 48000, other: 48000, weeksBelow: 0 },
  { id: "K06", name: "Simpang Lima – Rumah Sakit", deployed: 50, planned: 900, pax: 128, util: 0.72, revenue: 420000, energy: 46000, other: 48000, weeksBelow: 0 },
  { id: "K07", name: "Terminal Selatan – Pasar Lama", deployed: 45, planned: 800, pax: 112, util: 0.64, revenue: 385000, energy: 45000, other: 46000, weeksBelow: 1 },
  { id: "K08", name: "Kota Lama – Bandara", deployed: 35, planned: 700, pax: 98, util: 0.58, revenue: 350000, energy: 47000, other: 45000, weeksBelow: 3 },
  { id: "K09", name: "Kampus – Terminal Utara", deployed: 0, planned: 650, pax: 138, util: 0.75, revenue: 440000, energy: 49000, other: 49000, weeksBelow: 0 },
  { id: "K10", name: "Perumahan Timur – Pusat Kota", deployed: 0, planned: 550, pax: 120, util: 0.69, revenue: 405000, energy: 46000, other: 47000, weeksBelow: 0 },
  { id: "K11", name: "Pasar Baru – Kawasan Wisata", deployed: 0, planned: 450, pax: 105, util: 0.61, revenue: 372000, energy: 46000, other: 45000, weeksBelow: 0 },
  { id: "K12", name: "Terminal Barat – Desa Penyangga", deployed: 0, planned: 300, pax: 86, util: 0.52, revenue: 330000, energy: 44000, other: 44000, weeksBelow: 0 },
];

// ---- Illustrative: energy ----------------------------------------------------
// Terminals serving today's 500-unit fleet. share = share of system charging load.
export const terminals = [
  { name: "Terminal Induk", gridKw: 520, chargers: 14, swapBays: 4, solarKwp: 220, essKwh: 400, share: 0.27 },
  { name: "Terminal Timur", gridKw: 380, chargers: 10, swapBays: 3, solarKwp: 150, essKwh: 300, share: 0.19 },
  { name: "Stasiun Kota", gridKw: 320, chargers: 8, swapBays: 3, solarKwp: 0, essKwh: 250, share: 0.17 },
  { name: "Terminal Selatan", gridKw: 300, chargers: 8, swapBays: 2, solarKwp: 120, essKwh: 200, share: 0.16 },
  { name: "Pasar Induk", gridKw: 260, chargers: 7, swapBays: 2, solarKwp: 110, essKwh: 150, share: 0.12 },
  { name: "Depo Simpang Lima", gridKw: 220, chargers: 6, swapBays: 2, solarKwp: 0, essKwh: 100, share: 0.09 },
];

export const gridCapacityKw = terminals.reduce((s, t) => s + t.gridKw, 0);

// Hourly charging demand (kW) for the 500-unit fleet, 00:00–23:00.
// Unmanaged: drivers plug in at the midday break and after the evening shift.
const unmanaged = [180, 150, 130, 120, 140, 220, 380, 520, 640, 760, 980, 1500, 1900, 1650, 1100, 820, 760, 900, 1300, 1900, 2400, 2300, 1500, 600];
// SmartCharge: same energy, shifted to off-peak hours and spread across the day.
const managedShape = [1500, 1550, 1550, 1500, 1300, 900, 600, 500, 550, 750, 1000, 1250, 1350, 1300, 1050, 800, 650, 600, 700, 850, 1000, 1150, 1350, 1450];
// SolarHub output (kW) from 600 kWp across suitable terminals.
const solar = [0, 0, 0, 0, 0, 0, 30, 110, 210, 310, 390, 435, 450, 430, 380, 290, 190, 90, 20, 0, 0, 0, 0, 0];

const sum = (a) => a.reduce((s, v) => s + v, 0);
const scale = sum(unmanaged) / sum(managedShape);
const managed = managedShape.map((v) => Math.round(v * scale));

export const loadProfile = {
  hours: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
  unmanaged,
  managed,
  solar,
  managedNet: managed.map((v, i) => Math.max(0, v - solar[i])),
};

// ---- Illustrative: batteries --------------------------------------------------
export const batteryRules = {
  packKwh: 50,
  firstLifeMin: 80, // SoH % — below this, send for health assessment
  secondLifeMin: 70, // SoH % — below this, no longer fit for vehicles
  recycleBelow: 60, // SoH % — below this, recycle
};

export const stages = [
  { key: "first", label: "First life", initiative: "Battery Health Passport", use: "Electric angkot", color: "#2E7D40" },
  { key: "assess", label: "Assessment", initiative: "Health assessment", use: "Testing and classification", color: "#C2861B" },
  { key: "second", label: "Second life", initiative: "RES RePower", use: "Stationary ESS", color: "#9CC53B" },
  { key: "recycle", label: "End of life", initiative: "RES ReCycle", use: "Recycling", color: "#8C8377" },
];

export function stageOf(soh) {
  if (soh >= batteryRules.firstLifeMin) return "first";
  if (soh >= batteryRules.secondLifeMin) return "assess";
  if (soh >= batteryRules.recycleBelow) return "second";
  return "recycle";
}

// Deterministic pseudo-random generator so server and browser render the same fleet.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBatteries() {
  const rand = mulberry32(2026);
  const active = routes.filter((r) => r.deployed > 0);
  const slots = active.flatMap((r) => Array(r.deployed).fill(r.id));
  const count = Math.round(company.pilotFleet * 1.15); // 15% swap spares
  const packs = [];
  for (let i = 0; i < count; i++) {
    const heavy = rand() < 0.12; // early test packs with far more cycles
    const cycles = Math.round(heavy ? 900 + rand() * 700 : 120 + rand() * 520);
    let soh = 100 - cycles * 0.019 - rand() * 5;
    if (rand() < 0.03) soh -= 10 + rand() * 18; // occasional faulty pack
    soh = Math.max(52, Math.round(soh * 10) / 10);
    packs.push({
      id: `RES-B-${String(i + 1).padStart(4, "0")}`,
      soh,
      cycles,
      location: i < slots.length ? slots[i] : "Swap pool",
      stage: stageOf(soh),
    });
  }
  return packs;
}

export const batteries = buildBatteries();

// ---- Illustrative: financial assumptions (all editable in the dashboard) -------
export const defaultAssumptions = {
  rentalFee: 60000, // Battery-as-a-Service, Rp per driver per day
  serviceFee: 120000, // vehicle and energy service fee, Rp per driver per day
  operatingDays: 340, // per year
  opexShare: 0.2, // PT RES operating cost as a share of revenue
  discountRate: 0.1,
  horizonYears: 10,
  salvageShare: 0.2, // second-life and recycling value, share of battery cost
  batteryOpexPerDay: 10000, // swapping, monitoring, insurance per pack per day
  rentalScenarios: { low: 45000, base: 60000, high: 75000 },
  capex: [
    { key: "vehicle", label: "Additional electric angkot", qty: 9500, unit: "units", unitCost: 140e6 },
    { key: "battery", label: "Additional batteries", qty: 10925, unit: "packs", unitCost: 55e6 },
    { key: "charging", label: "Charging and swapping infrastructure", qty: 190, unit: "sites", unitCost: 1e9 },
    { key: "solar", label: "Solar PV", qty: 5000, unit: "kWp", unitCost: 11e6 },
    { key: "ess", label: "Energy storage system", qty: 15000, unit: "kWh", unitCost: 4e6 },
    { key: "digital", label: "Digital infrastructure", qty: 1, unit: "platform", unitCost: 20e9 },
  ],
};

// ---- Strategy pillars (from the case) ------------------------------------------
export const pillars = [
  { name: "Smart Energy Management", href: "/energy", initiatives: ["RES SmartCharge", "RES SolarHub", "Energy storage system"] },
  { name: "Circular Battery Economy", href: "/battery", initiatives: ["Battery Health Passport", "RES RePower", "RES ReCycle"] },
  { name: "Route-Based Financing", href: "/routes", initiatives: ["Route Investment Pool", "Battery-as-a-Service", "Circular Value Recovery"] },
  { name: "Driver Income Protection", href: "/drivers", initiatives: ["RES Income Shield", "Route Protection Fund"] },
  { name: "Route Management Dashboard", href: "/", initiatives: ["RES NEXUS"] },
];
