import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

const EUR_USD = 1.05;

const B = {
  net: 3700,
  rent: 1742, rentPartner: 700,
  groceries: 420, grocerySplit: 0.5,
  canteen: 110,
  dining: 230,
  gym: 39.9,
  transport: 32,
  phone: 9.99,
  subs: 85,
  insurance: 4.94,
  laundry: 10,
  barber: 19,
  gez: 18.36,
  shopping: 175,
  entertainment: 115,
  gas: 35,
  amexFee: 60,
  healthcare: 20,
};
const STEPH_BERLIN_GROSS_YR = 45000;
const STEPH_BERLIN_NET_FACTOR = 0.58;
const STEPH_BERLIN_RENT = 750;

const GROCERY_MX = 1.9;
const LUNCH_PPW = 5;
const LUNCH_COST = 10.5;
const LUNCH_MO = Math.round(LUNCH_PPW * 2 * (365 / 12 / 7) * LUNCH_COST);
const DINING_MX = 2.25 * 1.091 * 1.2;

const UTILS = {
  "94301": { label: "Palo Alto (CPAU)", electric: 145, gas: 55, water: 70, internet: 65 },
  "95113": { label: "San Jose (SJCE)", electric: 185, gas: 45, water: 60, internet: 65 },
  "94403": { label: "San Mateo (PG&E)", electric: 195, gas: 50, water: 65, internet: 65 },
  "94025": { label: "Menlo Park (PG&E)", electric: 190, gas: 52, water: 68, internet: 65 },
};

function fedTax(g) {
  const t = Math.max(0, g - 30000);
  const b = [[23850, .10], [73100, .12], [109750, .22], [187700, .24], [106450, .32], [250550, .35], [Infinity, .37]];
  let tax = 0, r = t;
  for (const [lim, rate] of b) { const c = Math.min(r, lim); tax += c * rate; r -= c; if (r <= 0) break; }
  return tax;
}
function fica(g) { return Math.min(g, 176100) * 0.062 + g * 0.0145 + Math.max(0, g - 250000) * 0.009; }
function ficaJoint(g1, g2) {
  const ss = Math.min(g1, 176100) * 0.062 + Math.min(g2, 176100) * 0.062;
  const med = (g1 + g2) * 0.0145;
  const addMed = Math.max(0, g1 + g2 - 250000) * 0.009;
  return ss + med + addMed;
}
function caTax(g) {
  const t = Math.max(0, g - 10726);
  const b = [[20824, .01], [28544, .02], [28550, .04], [30244, .06], [28538, .08], [561574, .093], [Infinity, .103]];
  let tax = 0, r = t;
  for (const [lim, rate] of b) { const c = Math.min(r, lim); tax += c * rate; r -= c; if (r <= 0) break; }
  return tax + g * 0.011;
}
function bayNet(g) { return (g - fedTax(g) - fica(g) - caTax(g)) / 12; }

const MOVING_EUR = 9000;
const FLIGHTS_USD = 3000;
const SETUP_BUFFER = 3000;
const RENTAL_PER_CAR_EUR = 1499;
const STEPH_CAR_EUR = 10000;
const CAR_OPTS = {
  low: { label: "Budget", total: 18000 },
  mid: { label: "Mid-range", total: 35000 },
  high: { label: "Premium", total: 40000 },
};

const PORTFOLIO = [
  { name: "Core S&P 500 ETF", shares: 9.61, note: "€350/mo DCA" },
  { name: "iBonds Dec 2026 Term", shares: 1114.62, note: "Maturing Dec 2026" },
  { name: "EUR Ultra-Short Income", shares: 18.69, note: "Cash-equivalent" },
  { name: "Dollar Treasury 1-3yr", shares: 399, note: "USD hedge" },
];
const RSU = [
  { date: "Dec 2024", granted: 86, vested: 22, sellable: 13.5 },
  { date: "May 2025", granted: 145, vested: 27, sellable: 15 },
  { date: "Nov 2025", granted: 12, vested: 0, sellable: 0 },
  { date: "Apr 2026", granted: "TBD", vested: 0, sellable: 0, note: "~$10k" },
];

const f$ = n => "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
const fE = n => "€" + Math.abs(Math.round(n)).toLocaleString("en-US");

function AnimNum({ val, prefix = "$" }) {
  const [d, setD] = useState(0);
  const raf = useRef(null), t0 = useRef(null), from = useRef(0);
  useEffect(() => {
    from.current = d; t0.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    const go = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / 600, 1);
      setD(from.current + (val - from.current) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, [val]);
  return <span>{prefix}{Math.abs(Math.round(d)).toLocaleString("en-US")}</span>;
}

function KPI({ label, children, sub, accent = "#00ffb4" }) {
  return (
    <div style={{ background: "#0a1218", border: "1px solid #0f2a20", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a7a5a", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#e0f4ec", letterSpacing: -1, marginTop: 4 }}>{children}</div>
      {sub && <div style={{ fontSize: 9, color: "#2a5a4a", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Sec({ title, right, children }) {
  return (
    <div style={{ background: "#0a1218", border: "1px solid #0f2a20", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "10px 18px", borderBottom: "1px solid #0f2a20", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: "#00ffb4", textTransform: "uppercase", opacity: .8 }}>{title}</span>
          {right && <span style={{ fontSize: 13, fontWeight: 600, color: "#e0f4ec" }}>{right}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function CRow({ label, be, ba, note, maxVal }) {
  const beUsd = be * EUR_USD;
  const pct = beUsd > 10 ? Math.round((ba - beUsd) / beUsd * 100) : null;
  const bW = maxVal > 0 ? Math.min(100, beUsd / maxVal * 100) : 0;
  const aW = maxVal > 0 ? Math.min(100, ba / maxVal * 100) : 0;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "140px 72px 1fr 14px 1fr 80px 48px", alignItems: "center", padding: "7px 18px", borderBottom: "1px solid #06100a", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#8ab0a8" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#4a7a6a", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{be > 0 ? fE(be) : "—"}</span>
        <div style={{ height: 4, background: "#08180e", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bW}%`, background: "#4488aa", transition: "width .5s" }} />
        </div>
        <span style={{ fontSize: 10, color: "#1a4030", textAlign: "center" }}>→</span>
        <div style={{ height: 4, background: "#08180e", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${aW}%`, background: "#00ffb4", transition: "width .5s" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c0e0d8", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{ba > 0 ? f$(ba) : "—"}</span>
        {pct !== null
          ? <span style={{ fontSize: 9, textAlign: "right", fontWeight: 600, color: pct > 0 ? "#ff6644" : "#00cc88" }}>{pct > 0 ? "+" : "−"}{Math.abs(pct)}%</span>
          : <span />}
      </div>
      {note && <div style={{ padding: "0 18px 6px", fontSize: 9, color: "#2a5040", lineHeight: 1.6 }}>{note}</div>}
    </>
  );
}

function GHead({ title, beTotal, baTotal }) {
  return (
    <div style={{ padding: "8px 18px", background: "#070f0a", borderBottom: "1px solid #0a2018", display: "grid", gridTemplateColumns: "1fr auto 20px auto", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 9, letterSpacing: 3, color: "#00ffb4", textTransform: "uppercase", opacity: .8 }}>{title}</span>
      <span style={{ fontSize: 11, color: "#4a7a6a" }}>{fE(beTotal)}</span>
      <span style={{ fontSize: 10, color: "#1a4030", textAlign: "center" }}>→</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#c0e0d8" }}>{f$(baTotal)}</span>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1218", border: "1px solid #0f2a20", padding: "10px 14px", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
      <div style={{ color: "#4a7a6a", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.stroke || p.color, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{f$(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [gross, setGross] = useState(150000);
  const [rent, setRent] = useState(3500);
  const [zip, setZip] = useState("94301");
  const [health, setHealth] = useState(300);
  const [car, setCar] = useState(true);
  const [carScenario, setCarScenario] = useState("mid");
  const [travel, setTravel] = useState(100);
  const [rentalCars, setRentalCars] = useState(2);
  const [teslaPkg, setTeslaPkg] = useState(50000);
  const [stephGross, setStephGross] = useState(0);
  const [stephStart, setStephStart] = useState(4);
  const [hireRsuAnnual, setHireRsuAnnual] = useState(40000);
  const [hireRsuVestStart, setHireRsuVestStart] = useState(0);

  const u = UTILS[zip] || UTILS["94301"];
  const utilTotal = u.electric + u.gas + u.water + u.internet;

  const fTax = fedTax(gross), fFica = fica(gross), fCa = caTax(gross);
  const totalTax = fTax + fFica + fCa;
  const netMo = (gross - totalTax) / 12;
  const effRate = gross > 0 ? totalTax / gross * 100 : 0;

  const bayGrocBase = Math.round(B.groceries * EUR_USD * GROCERY_MX);
  const bayDine = Math.round(B.dining * EUR_USD * DINING_MX);
  const baySubs = Math.round(B.subs * EUR_USD * 1.1);
  const bayShop = Math.round(B.shopping * EUR_USD * 1.2);
  const bayTrans = car ? 350 + 440 + 120 : 150;

  const rows = [
    { group: "Housing", items: [
      { label: "Rent", be: B.rent - B.rentPartner, ba: rent, note: "Berlin: your share after Stephanie's €700. Bay Area: you pay 100%" },
      { label: "Utilities", be: 0, ba: utilTotal, note: `Berlin: included in Nebenkosten. Bay: ${u.label}` },
    ]},
    { group: "Food", items: [
      { label: "Groceries (household)", be: Math.round(B.groceries * B.grocerySplit), ba: bayGrocBase, note: `Berlin: your 50% of €${B.groceries}/mo (EDEKA+REWE+LIDL). Bay: 100% × ${GROCERY_MX}x` },
      { label: "Weekday lunches", be: B.canteen, ba: LUNCH_MO, note: `Berlin: Tesla canteen subsidized. Bay: $${LUNCH_COST}/meal × 2pp × 5d/wk` },
      { label: "Dining + delivery", be: B.dining, ba: bayDine, note: `Uber Eats + restaurants. ×${DINING_MX.toFixed(1)} (price + CA 9.1% tax + 20% tip)` },
    ]},
    { group: "Transport", items: [
      { label: car ? "2× Cars (ins+gas+maint)" : "Transit (Caltrain)", be: B.transport + B.gas, ba: bayTrans, note: car ? "Berlin: BVG €32 + Aral gas €35. Bay: 2 cars, no lease — ins $350 + gas $440 + maint $120" : "Caltrain GoPass or Clipper" },
    ]},
    { group: "Personal", items: [
      { label: "Health insurance", be: B.insurance, ba: health, note: "Berlin: Feather liability (employer pays Krankenkasse). Bay: your premium share" },
      { label: "Gym (2 people)", be: B.gym, ba: 160, note: "Berlin: UrbanSports €39.90. Bay: 2× 24Hr Fitness / YMCA" },
      { label: "Phone", be: B.phone, ba: 45, note: "Berlin: ILIAD €9.99. Bay: T-Mobile / Mint" },
      { label: "Subscriptions", be: B.subs, ba: baySubs, note: "Apple, Starlink, Microsoft, services" },
    ]},
    { group: "Lifestyle", items: [
      { label: "Shopping", be: B.shopping, ba: bayShop, note: "Amazon + Temu + clothing (N26 + AMEX data)" },
      { label: "Entertainment", be: B.entertainment, ba: 200, note: "Events, bars, social" },
      { label: "Barber", be: B.barber, ba: 40 },
    ]},
    { group: "Other", items: [
      { label: "Laundry + GEZ + healthcare", be: B.laundry + B.gez + B.healthcare, ba: 0, note: "Bay: in-unit laundry, no Rundfunkbeitrag, healthcare via insurance" },
      { label: "AMEX Platinum", be: B.amexFee, ba: 58, note: "$695/yr US Platinum" },
      { label: "Travel budget", be: 0, ba: travel, note: "Editable — down from Berlin's heavy pattern" },
    ]},
  ];

  const berlinTotal = rows.flatMap(g => g.items).reduce((s, i) => s + i.be, 0);
  const bayTotal = rows.flatMap(g => g.items).reduce((s, i) => s + i.ba, 0);
  const berlinSurplus = B.net - berlinTotal;
  const stephBerlinNetMo = (STEPH_BERLIN_GROSS_YR * STEPH_BERLIN_NET_FACTOR) / 12;
  const stephBerlinGroceries = Math.round(B.groceries * (1 - B.grocerySplit));
  const stephBerlinExpenses = STEPH_BERLIN_RENT + stephBerlinGroceries;
  const berlinHouseholdSurplus = berlinSurplus + stephBerlinNetMo - stephBerlinExpenses;
  const baySurplus = netMo - bayTotal;
  const berlinSurplusUSD = berlinSurplus * EUR_USD;
  const berlinHouseholdSurplusUSD = berlinHouseholdSurplus * EUR_USD;
  const maxVal = Math.max(...rows.flatMap(g => g.items).map(i => Math.max(i.be * EUR_USD, i.ba)));

  const jointGross = gross + stephGross;
  const jointFed = fedTax(jointGross);
  const jointFica = ficaJoint(gross, stephGross);
  const jointCa = caTax(jointGross);
  const jointTax = jointFed + jointFica + jointCa;
  const jointNetMo = stephGross > 0 ? (jointGross - jointTax) / 12 : netMo;
  const jointSurplus = jointNetMo - bayTotal;
  const jointEffRate = jointGross > 0 ? jointTax / jointGross * 100 : 0;

  const stephTaxIncrement = stephGross > 0 ? jointTax - totalTax : 0;
  const stephMarginalRate = stephGross > 0 ? stephTaxIncrement / stephGross * 100 : 0;
  const stephNetContribMo = stephGross > 0 ? (stephGross - stephTaxIncrement) / 12 : 0;
  const stephFedIncrement = stephGross > 0 ? jointFed - fTax : 0;
  const stephFicaIncrement = stephGross > 0 ? jointFica - fFica : 0;
  const stephCaIncrement = stephGross > 0 ? jointCa - fCa : 0;

  const movingUSD = Math.round(MOVING_EUR * EUR_USD);
  const carBase = CAR_OPTS[carScenario].total;
  const carsTotal = carBase + Math.round(carBase * 0.12) + 1400;
  const rentalBridge = Math.round(rentalCars * RENTAL_PER_CAR_EUR * EUR_USD);
  const oneTimeTotal = movingUSD + FLIGHTS_USD + carsTotal + rentalBridge + SETUP_BUFFER;

  const stephCarUSD = Math.round(STEPH_CAR_EUR * EUR_USD);
  const gapAfterTesla = oneTimeTotal - teslaPkg;
  const stephUsed = Math.max(0, Math.min(stephCarUSD, gapAfterTesla));
  const stephKeeps = stephCarUSD - stephUsed;
  const outOfPocket = Math.max(0, gapAfterTesla - stephCarUSD);
  const teslaCoverAll = oneTimeTotal;
  const teslaMinimum = Math.max(0, oneTimeTotal - stephCarUSD);

  const monthsRecoup = baySurplus > 0 && outOfPocket > 0 ? Math.ceil(outOfPocket / baySurplus) : null;

  const nonCarCosts = movingUSD + FLIGHTS_USD + rentalBridge + SETUP_BUFFER;
  const fundingPool = teslaPkg + stephUsed;
  const netNonCar = Math.max(0, nonCarCosts - fundingPool);
  const netCar = Math.max(0, carsTotal - Math.max(0, fundingPool - nonCarCosts));

  const runwayData = useMemo(() => {
    const pts = [];
    let bayCum = 0, berlinCum = 0;
    for (let m = 0; m <= 24; m++) {
      if (m === 0) bayCum -= netNonCar;
      if (m === 2) bayCum -= netCar;
      if (m > 0) {
        const surplus = (stephGross > 0 && m >= stephStart) ? jointSurplus : baySurplus;
        bayCum += surplus;
        berlinCum += berlinHouseholdSurplusUSD;
      }
      const tag = m === 0 ? "Move" : m === 2 ? "M2 🚗" : (stephGross > 0 && m === stephStart) ? `M${m} ★` : `M${m}`;
      pts.push({
        month: tag,
        "Bay Area": Math.round(bayCum),
        Berlin: Math.round(berlinCum),
      });
    }
    return pts;
  }, [baySurplus, jointSurplus, stephGross, stephStart, berlinHouseholdSurplusUSD, netNonCar, netCar]);

  const breakeven = useMemo(() => {
    const target = berlinHouseholdSurplusUSD;
    for (let g = 80000; g <= 500000; g += 1000) {
      if (bayNet(g) - bayTotal >= target) return g;
    }
    return null;
  }, [bayTotal, berlinHouseholdSurplusUSD]);
  const salaryGapToBreakeven = breakeven ? gross - breakeven : null;

  const hireRsuQuarterGross = hireRsuAnnual / 4;
  const hireRsuQuarterNet = hireRsuQuarterGross * (1 - effRate / 100);
  const hireRsuSchedule = Array.from({ length: 4 }, (_, idx) => ({
    label: `Q${idx + 1}`,
    month: hireRsuVestStart + idx * 3,
    gross: hireRsuQuarterGross,
    net: hireRsuQuarterNet,
  }));

  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", background: "#080c0f", color: "#c8d8e0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select{background:#0a1a14;border:1px solid #0f3028;color:#00ffb4;font-family:'IBM Plex Mono',monospace;outline:none;font-size:13px;padding:6px 10px}
        input:focus,select:focus{border-color:#00ffb4;box-shadow:0 0 0 1px rgba(0,255,180,.12)}
        select{appearance:none;cursor:pointer;color:#c8d8e0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050a0d}::-webkit-scrollbar-thumb{background:#0f3028}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: "1px solid #0f3028", padding: "14px 28px", background: "linear-gradient(180deg,#050a0d,#080c0f)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#00ffb4", opacity: .7, textTransform: "uppercase" }}>Berlin → Bay Area</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e8f4f0", letterSpacing: -.5 }}>Digital Twin</div>
            <div style={{ fontSize: 9, color: "#4a7a6a" }}>Powered by real N26 + AMEX transaction data · Feb 2025 – Mar 2026</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[`MX ${GROCERY_MX}x`, `DINING ${DINING_MX.toFixed(1)}x`, u.label].map((t, i) => (
              <div key={i} style={{ padding: "3px 10px", fontSize: 9, letterSpacing: 1, fontWeight: 600, background: i === 1 ? "#1a1000" : "#001a10", color: i === 1 ? "#ffb400" : "#00ffb4", border: `1px solid ${i === 1 ? "#442800" : "#004428"}` }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Controls — You */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            ["Your Gross (USD/yr)", gross, setGross, 5000],
            ["Rent (USD/mo)", rent, setRent, 100],
            ["Health (USD/mo)", health, setHealth, 25],
            ["Travel (USD/mo)", travel, setTravel, 50],
          ].map(([lbl, val, fn, step]) => (
            <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 9, letterSpacing: 1, color: "#4a8a7a", textTransform: "uppercase" }}>{lbl}</span>
              <input type="number" value={val} step={step} onChange={e => fn(+e.target.value)} style={{ width: 120, fontWeight: 600 }} />
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: "#4a8a7a", textTransform: "uppercase" }}>Zip</span>
            <select value={zip} onChange={e => setZip(e.target.value)} style={{ width: 180 }}>
              {Object.entries(UTILS).map(([z, p]) => <option key={z} value={z}>{z} — {p.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
            <span style={{ fontSize: 9, color: "#4a8a7a" }}>2× CARS</span>
            <label style={{ position: "relative", width: 40, height: 20, cursor: "pointer", display: "block" }}>
              <input type="checkbox" checked={car} onChange={e => setCar(e.target.checked)} style={{ opacity: 0, position: "absolute" }} />
              <div style={{ position: "absolute", inset: 0, background: car ? "#001a10" : "#0f2a20", border: `1px solid ${car ? "#004428" : "#0f3028"}`, transition: ".2s" }}>
                <div style={{ position: "absolute", height: 12, width: 12, bottom: 3, left: car ? 23 : 3, background: car ? "#00ffb4" : "#2a5a4a", transition: ".2s" }} />
              </div>
            </label>
          </div>
        </div>

        {/* Controls — Stephanie */}
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#b48aff", textTransform: "uppercase", alignSelf: "center", paddingBottom: 4, fontWeight: 600 }}>Stephanie</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: "#8a6abf", textTransform: "uppercase" }}>Gross (USD/yr)</span>
            <input type="number" value={stephGross} step={5000} onChange={e => setStephGross(Math.max(0, +e.target.value))} style={{ width: 130, fontWeight: 600, color: "#b48aff", borderColor: "#3a2060" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: "#8a6abf", textTransform: "uppercase" }}>Starts working (month)</span>
            <input type="number" value={stephStart} min={1} max={24} step={1} onChange={e => setStephStart(Math.max(1, Math.min(24, +e.target.value)))} style={{ width: 80, fontWeight: 600, color: "#b48aff", borderColor: "#3a2060" }} />
          </div>
          {stephGross > 0 && (
            <div style={{ fontSize: 10, color: "#8a6abf", alignSelf: "center", paddingBottom: 4, lineHeight: 1.8 }}>
              Steph net contribution: <span style={{ color: "#b48aff", fontWeight: 600 }}>{f$(Math.round(stephNetContribMo))}/mo</span>
              <span style={{ color: "#6a4a8a" }}> · marginal rate {stephMarginalRate.toFixed(1)}%</span>
              <span style={{ color: "#6a4a8a" }}> · </span>
              household surplus: <span style={{ color: jointSurplus >= 0 ? "#00cc88" : "#ff6644", fontWeight: 600 }}>{jointSurplus >= 0 ? "+" : "-"}{f$(Math.abs(Math.round(jointSurplus)))}/mo</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── MONTHLY NET BANNER ── */}
        <div style={{ display: "grid", gridTemplateColumns: stephGross > 0 ? "1fr 1fr" : "1fr", gap: 12 }}>
          <div style={{ background: "linear-gradient(135deg,#0a1a14,#0a1218)", border: "1px solid #0f2a20", padding: "18px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#00ffb4,#00cc88)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a7a5a", textTransform: "uppercase" }}>Your Monthly Net</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#e0f4ec", letterSpacing: -2, marginTop: 2 }}>
                  <AnimNum val={Math.round(netMo)} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#4a7a6a" }}>from {f$(gross)}/yr gross</div>
                <div style={{ fontSize: 10, color: "#ffb400" }}>{effRate.toFixed(1)}% effective tax</div>
                <div style={{ fontSize: 10, color: "#4a7a6a" }}>{f$(Math.round(totalTax))}/yr to gov</div>
              </div>
            </div>
          </div>
          {stephGross > 0 && (
            <div style={{ background: "linear-gradient(135deg,#140a1a,#0a1218)", border: "1px solid #2a1040", padding: "18px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#b48aff,#8a60cc)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#6a4a8a", textTransform: "uppercase" }}>Household Monthly Net (MFJ)</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "#e0f4ec", letterSpacing: -2, marginTop: 2 }}>
                    <AnimNum val={Math.round(jointNetMo)} />
                  </div>
                  <div style={{ fontSize: 9, color: "#6a4a8a", marginTop: 2 }}>starting month {stephStart}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#8a6abf" }}>You: {f$(gross)} + Steph: {f$(stephGross)}</div>
                  <div style={{ fontSize: 10, color: "#ffb400" }}>{jointEffRate.toFixed(1)}% joint tax rate</div>
                  <div style={{ fontSize: 10, color: "#b48aff" }}>Steph's net: +{f$(Math.round(stephNetContribMo))}/mo</div>
                  <div style={{ fontSize: 10, color: "#ff6644", opacity: stephMarginalRate > effRate ? 1 : 0.5 }}>Her marginal rate: {stephMarginalRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── HERO KPIs ── */}
        <div style={{ display: "grid", gridTemplateColumns: stephGross > 0 ? "repeat(5,1fr)" : "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Berlin Household Surplus" sub="you + Stephanie baseline" accent="#4488aa">
            <AnimNum val={Math.round(berlinHouseholdSurplus)} prefix="€" />
          </KPI>
          <KPI label="Bay Surplus (solo)" sub="per month (you only)" accent={baySurplus >= 0 ? "#00ffb4" : "#ff4444"}>
            <AnimNum val={Math.abs(Math.round(baySurplus))} prefix={baySurplus < 0 ? "-$" : "$"} />
          </KPI>
          {stephGross > 0 && (
            <KPI label="Household Surplus" sub={`from month ${stephStart}`} accent={jointSurplus >= 0 ? "#b48aff" : "#ff4444"}>
              <AnimNum val={Math.abs(Math.round(jointSurplus))} prefix={jointSurplus < 0 ? "-$" : "$"} />
            </KPI>
          )}
          <KPI label="US Effective Tax" sub={stephGross > 0 ? `Solo ${effRate.toFixed(1)}% → Joint ${jointEffRate.toFixed(1)}%` : `Fed + CA + FICA + SDI on ${f$(gross)}`} accent="#ffb400">
            {stephGross > 0 ? `${jointEffRate.toFixed(1)}%` : `${effRate.toFixed(1)}%`}
          </KPI>
          <KPI label={outOfPocket > 0 ? "Months to Recoup" : "Out of Pocket"} sub={outOfPocket > 0 ? `${f$(outOfPocket)} net after funding` : `Tesla ${f$(teslaPkg)} + car ${f$(stephCarUSD)}`} accent={outOfPocket === 0 ? "#00ffb4" : monthsRecoup && monthsRecoup <= 12 ? "#ffb400" : "#ff4444"}>
            {outOfPocket === 0 ? "Covered" : monthsRecoup ? `${monthsRecoup}mo` : "∞"}
          </KPI>
        </div>
        <div style={{ marginTop: -2, fontSize: 10, color: "#2a5a4a" }}>
          Runway and monthly surplus are based on salary and costs only. Equity is tracked below as long-term financial health.
        </div>

        {/* ── MONTHLY TWIN ── */}
        <Sec title="Monthly Comparison" right={<span><span style={{ color: "#4488aa" }}>■</span> Berlin&ensp;<span style={{ color: "#00ffb4" }}>■</span> Bay Area</span>}>
          {rows.map(g => {
            const gBe = g.items.reduce((s, i) => s + i.be, 0);
            const gBa = g.items.reduce((s, i) => s + i.ba, 0);
            return (
              <div key={g.group}>
                <GHead title={g.group} beTotal={gBe} baTotal={gBa} />
                {g.items.map(i => <CRow key={i.label} {...i} maxVal={maxVal} />)}
              </div>
            );
          })}
          <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: 12, borderTop: "2px solid #0f2a20" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#e0f4ec" }}>TOTAL</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#4488aa", letterSpacing: 1 }}>BERLIN (PERSONAL)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e0f4ec" }}>{fE(berlinTotal)}</div>
              <div style={{ fontSize: 10, color: "#4a7a6a" }}>surplus <span style={{ color: berlinHouseholdSurplus >= 0 ? "#00cc88" : "#ff4444", fontWeight: 600 }}>{fE(Math.round(berlinHouseholdSurplus))}</span>/mo</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#00ffb4", letterSpacing: 1 }}>BAY AREA (100%)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e0f4ec" }}>{f$(Math.round(bayTotal))}</div>
              <div style={{ fontSize: 10, color: "#4a7a6a" }}>surplus <span style={{ color: baySurplus >= 0 ? "#00cc88" : "#ff4444", fontWeight: 600 }}>{baySurplus >= 0 ? "+" : "-"}{f$(Math.abs(Math.round(baySurplus)))}</span>/mo</div>
            </div>
          </div>
        </Sec>

        {/* ── HOUSEHOLD SAVINGS PROJECTION ── */}
        <Sec title="24-Month Savings Projection" right={stephGross > 0 ? `Steph joins M${stephStart}` : "Solo income"}>
          <div style={{ padding: "16px 18px 8px" }}>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={runwayData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bayG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffb4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00ffb4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f2018" />
                <XAxis dataKey="month" stroke="#2a5a4a" fontSize={9} tick={{ fill: "#2a5a4a" }} interval={1} />
                <YAxis stroke="#2a5a4a" fontSize={10} tick={{ fill: "#2a5a4a" }} tickFormatter={v => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v / 1000))}k`} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={0} stroke="#1a3a2a" strokeDasharray="2 2" />
                <Area type="monotone" dataKey="Bay Area" stroke="#00ffb4" fill="url(#bayG)" strokeWidth={2} dot={{ r: 2, fill: "#00ffb4" }} />
                <Area type="monotone" dataKey="Berlin" stroke="#4488aa" fill="none" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2, fill: "#4488aa" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, padding: "8px 18px 4px", fontSize: 10, color: "#4a7a6a", flexWrap: "wrap" }}>
            <span><span style={{ color: "#00ffb4" }}>●</span> Bay Area — {outOfPocket > 0 ? `${f$(outOfPocket)} net hit` : "fully funded"}{stephGross > 0 ? `, solo ${f$(Math.round(baySurplus))}/mo → joint ${f$(Math.round(jointSurplus))}/mo at M${stephStart}` : `, ${f$(Math.round(baySurplus))}/mo surplus`}</span>
            <span><span style={{ color: "#4488aa" }}>●</span> Berlin household — steady {fE(Math.round(berlinHouseholdSurplus))}/mo ({f$(Math.round(berlinHouseholdSurplusUSD))})</span>
          </div>
          {/* Milestones */}
          <div style={{ padding: "8px 18px 14px" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Year 1", val: runwayData[12]?.["Bay Area"], m: 12 },
                { label: "Year 2", val: runwayData[24]?.["Bay Area"], m: 24 },
              ].map(({ label, val, m }) => val != null && (
                <div key={label} style={{ padding: "6px 12px", background: "#081810", border: "1px solid #0f2a20", fontSize: 10 }}>
                  <span style={{ color: "#4a7a6a" }}>{label} (M{m}): </span>
                  <span style={{ color: val >= 0 ? "#00ffb4" : "#ff6644", fontWeight: 600 }}>{val >= 0 ? "+" : "-"}{f$(Math.abs(val))}</span>
                  <span style={{ color: "#2a5040" }}> cumulative</span>
                </div>
              ))}
              {stephGross > 0 && (() => {
                const yr2Solo = (baySurplus * 24) - netNonCar - netCar;
                const withStephDelta = Math.round((runwayData[24]?.["Bay Area"] || 0) - yr2Solo);
                return withStephDelta > 0 ? (
                  <div style={{ padding: "6px 12px", background: "#140a1a", border: "1px solid #2a1040", fontSize: 10 }}>
                    <span style={{ color: "#8a6abf" }}>Steph's impact (2yr): </span>
                    <span style={{ color: "#b48aff", fontWeight: 600 }}>+{f$(withStephDelta)}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </Sec>

        {/* ── TAX DUEL ── */}
        <Sec title="Tax Comparison · 2026 MFJ">
          <div style={{ display: "grid", gridTemplateColumns: stephGross > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 1, background: "#0a1810" }}>
            {/* Germany */}
            <div style={{ background: "#0a1218" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f2a20", fontSize: 11, fontWeight: 600, color: "#8ab0a8" }}>🇩🇪 Germany (household baseline)</div>
              {[
                ["Monthly Net", fE(B.net)],
                ["Steph Gross", fE(STEPH_BERLIN_GROSS_YR / 12)],
                ["Steph Est. Net", fE(Math.round(stephBerlinNetMo))],
                ["Steph Costs", fE(Math.round(stephBerlinExpenses))],
                ["Household Surplus", fE(Math.round(berlinHouseholdSurplus))],
                ["Approx. Gross", fE(Math.round(B.net / 0.58))],
                ["Effective Rate", "~42%"],
                ["Includes", "Income tax + Soli + Social"],
                ["Healthcare", "Employer-paid (Krankenkasse)"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 16px", borderBottom: "1px solid #06100a", fontSize: 11 }}>
                  <span style={{ color: "#4a7a6a" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#c0e0d8" }}>{v}</span>
                </div>
              ))}
            </div>
            {/* US Solo */}
            <div style={{ background: "#0a1218" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f2a20", fontSize: 11, fontWeight: 600, color: "#8ab0a8" }}>🇺🇸 You solo ({f$(gross)})</div>
              {[
                ["Federal Income", f$(Math.round(fTax))],
                ["FICA (SS+Med)", f$(Math.round(fFica))],
                ["CA State + SDI", f$(Math.round(fCa))],
                ["Total Tax", f$(Math.round(totalTax))],
                ["Monthly Net", f$(Math.round(netMo))],
                ["Effective Rate", `${effRate.toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 16px", borderBottom: "1px solid #06100a", fontSize: 11 }}>
                  <span style={{ color: "#4a7a6a" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#c0e0d8" }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Joint MFJ — only when Steph has income */}
            {stephGross > 0 && (
              <div style={{ background: "#0a1218" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f2a20", fontSize: 11, fontWeight: 600, color: "#b48aff" }}>🇺🇸 Joint MFJ ({f$(jointGross)})</div>
                {[
                  ["Federal Income", f$(Math.round(jointFed)), `+${f$(Math.round(stephFedIncrement))}`],
                  ["FICA (SS+Med)", f$(Math.round(jointFica)), `+${f$(Math.round(stephFicaIncrement))}`],
                  ["CA State + SDI", f$(Math.round(jointCa)), `+${f$(Math.round(stephCaIncrement))}`],
                  ["Total Joint Tax", f$(Math.round(jointTax)), `+${f$(Math.round(stephTaxIncrement))}`],
                  ["Monthly Net", f$(Math.round(jointNetMo)), `+${f$(Math.round(jointNetMo - netMo))}`],
                  ["Joint Eff. Rate", `${jointEffRate.toFixed(1)}%`, `+${(jointEffRate - effRate).toFixed(1)}pp`],
                ].map(([k, v, delta]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 16px", borderBottom: "1px solid #06100a", fontSize: 11, gap: 8 }}>
                    <span style={{ color: "#4a7a6a" }}>{k}</span>
                    <span style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: "#c0e0d8" }}>{v}</span>
                      <span style={{ fontSize: 9, color: "#6a4a8a", alignSelf: "center" }}>{delta}</span>
                    </span>
                  </div>
                ))}
                <div style={{ padding: "10px 16px", borderTop: "1px solid #0f2a20" }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: "#ffb400", textTransform: "uppercase", marginBottom: 4 }}>Steph's marginal cost</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#4a7a6a" }}>Her gross</span>
                    <span style={{ fontWeight: 600, color: "#c0e0d8" }}>{f$(stephGross)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#4a7a6a" }}>Tax on her income</span>
                    <span style={{ fontWeight: 600, color: "#ff6644" }}>{f$(Math.round(stephTaxIncrement))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#4a7a6a" }}>Her marginal rate</span>
                    <span style={{ fontWeight: 600, color: stephMarginalRate > effRate ? "#ff6644" : "#ffb400" }}>{stephMarginalRate.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4, paddingTop: 4, borderTop: "1px solid #0f2a20" }}>
                    <span style={{ color: "#4a7a6a" }}>Her net contribution</span>
                    <span style={{ fontWeight: 600, color: "#00cc88" }}>{f$(Math.round(stephGross - stephTaxIncrement))}/yr ({f$(Math.round(stephNetContribMo))}/mo)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: "12px 18px", fontSize: 10, color: "#2a5a4a", lineHeight: 1.7, borderTop: "1px solid #0f2a20" }}>
            MFJ (Married Filing Jointly). Standard deduction $30k. {stephGross > 0 ? `Steph's income is taxed at YOUR marginal bracket (${stephMarginalRate.toFixed(1)}%), not from the bottom — this is the marriage tax "penalty" on second incomes.` : "Wife income $0 currently."} Not modeled: 401(k) pre-tax ($23.5k limit ×2), HSA ($8.3k family) — could cut effective rate by 3-5pts.
          </div>
        </Sec>

        {/* ── ONE-TIME COSTS ── */}
        <Sec title="One-Time Moving Costs">
          <div style={{ padding: "14px 18px" }}>
            {/* Controls row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, letterSpacing: 1, color: "#4a8a7a", textTransform: "uppercase" }}>Car scenario</span>
                <select value={carScenario} onChange={e => setCarScenario(e.target.value)} style={{ width: 200 }}>
                  {Object.entries(CAR_OPTS).map(([k, v]) => <option key={k} value={k}>{v.label} — {f$(v.total)}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, letterSpacing: 1, color: "#4a8a7a", textTransform: "uppercase" }}>Rental cars</span>
                <input type="number" value={rentalCars} min={0} step={1} onChange={e => setRentalCars(Math.max(0, +e.target.value))} style={{ width: 80, fontWeight: 600 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, letterSpacing: 1, color: "#ffb400", textTransform: "uppercase" }}>Tesla relocation pkg (USD)</span>
                <input type="number" value={teslaPkg} step={5000} onChange={e => setTeslaPkg(Math.max(0, +e.target.value))} style={{ width: 140, fontWeight: 600, color: "#ffb400", borderColor: "#442800" }} />
              </div>
            </div>

            {/* Cost breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
              <KPI label="Moving + Flights" sub={`€${MOVING_EUR.toLocaleString()} ship + 2× flights`} accent="#4488aa">{f$(movingUSD + FLIGHTS_USD)}</KPI>
              <KPI label="2× Used Cars" sub="purchase + tax + reg" accent="#4488aa">{f$(carsTotal)}</KPI>
              <KPI label="Rental Bridge" sub={`${rentalCars} cars × 6 weeks`} accent="#4488aa">{f$(rentalBridge)}</KPI>
              <KPI label="Setup Buffer" accent="#4488aa">$3,000</KPI>
              <KPI label="Grand Total" accent="#ff6644">{f$(oneTimeTotal)}</KPI>
            </div>

            {/* Funding sources */}
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#00ffb4", textTransform: "uppercase", marginBottom: 8, opacity: .8 }}>Funding Sources</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              <KPI label="Tesla Relocation" sub="lump sum (editable above)" accent="#ffb400">{f$(teslaPkg)}</KPI>
              <KPI label="Stephanie's Car Sale" sub={`€${STEPH_CAR_EUR.toLocaleString()} × ${EUR_USD}`} accent="#4488aa">{f$(stephCarUSD)}</KPI>
              <KPI label="Total Available" accent="#00ffb4">{f$(teslaPkg + stephCarUSD)}</KPI>
            </div>

            {/* Scenario analysis */}
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#ffb400", textTransform: "uppercase", marginBottom: 10, opacity: .8 }}>What to Ask Tesla</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Scenario A: Tesla covers everything */}
              <div style={{ border: `1px solid ${teslaPkg >= oneTimeTotal ? "#004428" : "#0f2a20"}`, background: teslaPkg >= oneTimeTotal ? "#001a10" : "#0a1218", padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#00ffb4", textTransform: "uppercase", marginBottom: 6 }}>Best case — Tesla covers all</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#e0f4ec", letterSpacing: -1 }}>{f$(teslaCoverAll)}</div>
                <div style={{ fontSize: 10, color: "#4a7a6a", marginTop: 4 }}>Ask Tesla for {f$(teslaCoverAll)}</div>
                <div style={{ fontSize: 10, color: "#00cc88", marginTop: 2 }}>Stephanie keeps her full €{STEPH_CAR_EUR.toLocaleString()} ({f$(stephCarUSD)})</div>
                {teslaPkg >= oneTimeTotal && (
                  <div style={{ marginTop: 8, padding: "4px 8px", background: "#003a1e", fontSize: 9, color: "#00ffb4", fontWeight: 600, display: "inline-block" }}>CURRENT SCENARIO</div>
                )}
              </div>

              {/* Scenario B: Tesla covers partial, car fills gap */}
              <div style={{ border: `1px solid ${teslaPkg < oneTimeTotal && gapAfterTesla <= stephCarUSD ? "#442800" : "#0f2a20"}`, background: teslaPkg < oneTimeTotal && gapAfterTesla <= stephCarUSD ? "#1a1000" : "#0a1218", padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffb400", textTransform: "uppercase", marginBottom: 6 }}>Minimum — Car fills the gap</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#e0f4ec", letterSpacing: -1 }}>{f$(teslaMinimum)}</div>
                <div style={{ fontSize: 10, color: "#4a7a6a", marginTop: 4 }}>Ask Tesla for at least {f$(teslaMinimum)}</div>
                <div style={{ fontSize: 10, color: "#ffb400", marginTop: 2 }}>Car sale covers the remaining {f$(Math.min(stephCarUSD, oneTimeTotal - teslaMinimum))}</div>
                <div style={{ fontSize: 10, color: "#4a7a6a", marginTop: 1 }}>Stephanie nets €0 from sale</div>
                {teslaPkg < oneTimeTotal && gapAfterTesla <= stephCarUSD && (
                  <div style={{ marginTop: 8, padding: "4px 8px", background: "#332000", fontSize: 9, color: "#ffb400", fontWeight: 600, display: "inline-block" }}>CURRENT SCENARIO</div>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#081810", border: "1px solid #0f2a20", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#4a7a6a", textTransform: "uppercase" }}>Recommended Ask (Min)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ffb400" }}>{f$(teslaMinimum)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#4a7a6a", textTransform: "uppercase" }}>Recommended Ask (Full)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#00ffb4" }}>{f$(teslaCoverAll)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#4a7a6a", textTransform: "uppercase" }}>Range Width</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#c0e0d8" }}>{f$(teslaCoverAll - teslaMinimum)}</div>
              </div>
            </div>

            {/* Current state summary */}
            <div style={{ marginTop: 14, padding: "12px 16px", background: outOfPocket > 0 ? "#1a0a0a" : gapAfterTesla <= 0 ? "#001a10" : "#1a1000", border: `1px solid ${outOfPocket > 0 ? "#442020" : gapAfterTesla <= 0 ? "#004428" : "#442800"}` }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#8ab0a8", textTransform: "uppercase", marginBottom: 6 }}>With current Tesla package of {f$(teslaPkg)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#4a7a6a" }}>Gap after Tesla</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: gapAfterTesla <= 0 ? "#00cc88" : "#ff6644" }}>
                    {gapAfterTesla <= 0 ? `+${f$(Math.abs(gapAfterTesla))} surplus` : f$(gapAfterTesla)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#4a7a6a" }}>Stephanie uses from car</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stephUsed > 0 ? "#ffb400" : "#00cc88" }}>
                    {stephUsed > 0 ? f$(stephUsed) : "Nothing"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#4a7a6a" }}>Stephanie keeps</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stephKeeps >= stephCarUSD ? "#00cc88" : stephKeeps > 0 ? "#ffb400" : "#ff6644" }}>
                    {stephKeeps > 0 ? `€${Math.round(stephKeeps / EUR_USD).toLocaleString()} (${f$(stephKeeps)})` : "€0"}
                  </div>
                </div>
              </div>
              {outOfPocket > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#ff6644", fontWeight: 600 }}>
                  Still {f$(outOfPocket)} out of pocket even with car sale — {baySurplus > 0 ? `recoup in ${Math.ceil(outOfPocket / baySurplus)} months` : "negative surplus, increase salary"}
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: "12px 18px", fontSize: 10, color: "#2a5a4a", lineHeight: 1.7, borderTop: "1px solid #0f2a20" }}>
            Cars: 2× used sedan (Camry/Accord), purchased outright. CA sales tax ~9.1% + DMV fees ≈ 12% total. Registration ~$700/car/yr.
            Rental bridge: Hertz/Enterprise with IDP — no SSN needed. Get IDP at ADAC before leaving Berlin (€15, 1 day).
            Tesla relocation package: typically gross-up included. Slide the input to model different outcomes.
          </div>
        </Sec>

        <Sec title="Negotiation Brief" right="Copy/Paste Ready">
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#c0e0d8", lineHeight: 1.8, background: "#0a1218", border: "1px solid #0f2a20", padding: "12px 14px", whiteSpace: "pre-wrap" }}>
              {`I am targeting a Bay Area package that preserves my current Berlin monthly surplus.

Berlin household surplus baseline: ${fE(Math.round(berlinHouseholdSurplus))}/mo (${f$(Math.round(berlinHouseholdSurplusUSD))}/mo equivalent).
Modeled Bay breakeven salary: ${breakeven ? f$(breakeven) : "N/A"} gross/year.
Current modeled salary: ${f$(gross)} (${salaryGapToBreakeven === null ? "N/A" : salaryGapToBreakeven >= 0 ? `+${f$(Math.round(salaryGapToBreakeven))}` : `-${f$(Math.round(Math.abs(salaryGapToBreakeven)))}`} vs breakeven).

Relocation requirement:
- Minimum ask: ${f$(teslaMinimum)} (if personal car-sale funds are used)
- Full-coverage ask: ${f$(teslaCoverAll)} (no personal asset use)
- With current relocation package ${f$(teslaPkg)}: ${outOfPocket > 0 ? `${f$(outOfPocket)} out of pocket` : "fully covered"}
${outOfPocket > 0 ? `- Recoup time at current surplus: ${monthsRecoup ? `${monthsRecoup} months` : "not feasible with current monthly surplus"}` : ""}

This request is based on modeled monthly cashflow sustainability and one-time relocation requirements, not equity liquidation.`}
            </div>
          </div>
        </Sec>

        {/* ── BREAKEVEN ── */}
        <Sec title="Breakeven Salary Finder" right={breakeven ? `${f$(breakeven)} minimum` : "—"}>
          <div style={{ padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#4a7a6a", marginBottom: 8 }}>
              What gross salary matches your Berlin household surplus of {fE(Math.round(berlinHouseholdSurplus))}/mo ({f$(Math.round(berlinHouseholdSurplusUSD))})?
            </div>
            {breakeven ? (
              <>
                <div style={{ fontSize: 42, fontWeight: 700, color: "#00ffb4", letterSpacing: -2 }}>{f$(breakeven)}</div>
                <div style={{ fontSize: 11, color: "#4a7a6a", marginTop: 4 }}>
                  At your current {f$(gross)}, Bay surplus is <span style={{ color: "#00cc88", fontWeight: 600 }}>{f$(Math.round(baySurplus))}/mo</span> —
                  that's <span style={{ color: "#00cc88", fontWeight: 600 }}>{f$(Math.round(baySurplus - berlinHouseholdSurplusUSD))}/mo</span> above breakeven
                </div>
              </>
            ) : (
              <div style={{ fontSize: 16, color: "#ff4444" }}>No salary in range matches Berlin surplus at current Bay costs</div>
            )}
          </div>
          <div style={{ padding: "0 18px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2a5a4a", marginBottom: 4 }}>
              <span>$80k</span><span>$500k</span>
            </div>
            <div style={{ position: "relative", height: 8, background: "#08180e", borderRadius: 2, overflow: "hidden" }}>
              {breakeven && (
                <div style={{
                  position: "absolute", left: `${(breakeven - 80000) / (500000 - 80000) * 100}%`,
                  top: 0, bottom: 0, width: 2, background: "#ffb400",
                }} />
              )}
              <div style={{
                position: "absolute", left: `${(gross - 80000) / (500000 - 80000) * 100}%`,
                top: -3, width: 8, height: 14, background: "#00ffb4", borderRadius: 2, transform: "translateX(-50%)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2a5a4a", marginTop: 4 }}>
              <span>{breakeven ? `Breakeven: ${f$(breakeven)}` : ""}</span>
              <span>You: {f$(gross)}</span>
            </div>
          </div>
        </Sec>

        {/* ── WEALTH CONTEXT ── */}
        <Sec title="Your Financial Position">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#0a1810" }}>
            <div style={{ background: "#0a1218", padding: "14px 18px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#4488aa", textTransform: "uppercase", marginBottom: 10 }}>ETF Portfolio</div>
              {PORTFOLIO.map(p => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #06100a", fontSize: 11 }}>
                  <span style={{ color: "#8ab0a8" }}>{p.name}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#c0e0d8", fontWeight: 600 }}>{p.shares.toLocaleString()} shares</div>
                    <div style={{ color: "#2a5a4a", fontSize: 9 }}>{p.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0a1218", padding: "14px 18px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffb400", textTransform: "uppercase", marginBottom: 10 }}>Tesla RSU Grants</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, letterSpacing: 1, color: "#8a6abf", textTransform: "uppercase" }}>New Hire RSU (USD/yr)</span>
                  <input type="number" value={hireRsuAnnual} step={5000} min={0} onChange={e => setHireRsuAnnual(Math.max(0, +e.target.value))} style={{ width: 130, fontWeight: 600, color: "#b48aff", borderColor: "#3a2060" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, letterSpacing: 1, color: "#8a6abf", textTransform: "uppercase" }}>Vest start month</span>
                  <input type="number" value={hireRsuVestStart} step={1} min={0} max={24} onChange={e => setHireRsuVestStart(Math.max(0, Math.min(24, +e.target.value)))} style={{ width: 110, fontWeight: 600, color: "#b48aff", borderColor: "#3a2060" }} />
                </div>
              </div>
              {RSU.map(r => (
                <div key={r.date} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #06100a", fontSize: 11 }}>
                  <span style={{ color: "#8ab0a8" }}>{r.date}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#c0e0d8", fontWeight: 600 }}>{r.granted} granted{r.sellable > 0 ? ` · ${r.sellable} sellable` : ""}</div>
                    <div style={{ color: "#2a5a4a", fontSize: 9 }}>{r.vested} vested{r.note ? ` · ${r.note}` : ""}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #0f2a20" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#b48aff", textTransform: "uppercase", marginBottom: 6 }}>New Hire Grant Projection</div>
                <div style={{ fontSize: 10, color: "#4a7a6a", marginBottom: 6 }}>
                  Annual gross {f$(hireRsuAnnual)} · estimated net after tax {f$(Math.round(hireRsuAnnual * (1 - effRate / 100)))}
                </div>
                {hireRsuSchedule.map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #06100a", fontSize: 10 }}>
                    <span style={{ color: "#8a6abf" }}>{item.label} (M{item.month})</span>
                    <span style={{ color: "#c0e0d8", fontWeight: 600 }}>
                      {f$(Math.round(item.gross))} gross · {f$(Math.round(item.net))} est. net
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: "#4a7a6a" }}>
                Total sellable: {RSU.reduce((s, r) => s + (typeof r.sellable === "number" ? r.sellable : 0), 0)} shares · Vesting quarterly
              </div>
            </div>
          </div>
        </Sec>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", padding: "12px 0 24px", fontSize: 9, color: "#1a3a2a", letterSpacing: 1 }}>
          DIGITAL TWIN v4.0 · Data-driven from N26 + AMEX + Flighty · {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </div>

      </div>
    </div>
  );
}
