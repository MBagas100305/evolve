"use client";

import { PageHeader, Panel, Stat, Badge, NumberField } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { useAssumptions } from "@/components/Assumptions";
import { company, routes } from "@/lib/data";
import { averageDriver, cashflows, irr, maxRentalFee, minRentalFee, netIncome, npv, payback, totalCapex } from "@/lib/finance";
import { num, pct, rp, rpAxis, rpShort } from "@/lib/format";

export default function FinancePage() {
  const { assumptions: a, set, setCapex, setScenario, reset, isDefault } = useAssumptions();

  const total = totalCapex(a.capex);
  const flows = cashflows(a);
  const projectNpv = npv(flows, a.discountRate);
  const projectIrr = irr(flows);
  const projectPayback = payback(flows);

  const avg = averageDriver();
  const minFee = minRentalFee(a);
  const maxFee = maxRentalFee(avg, a);

  const scenarios = ["low", "base", "high"].map((name) => {
    const fee = a.rentalScenarios[name];
    const f = cashflows(a, fee);
    const scenarioNpv = npv(f, a.discountRate);
    const scenarioIrr = irr(f);
    const income = netIncome(avg, a, fee);
    const routesBelow = routes.filter((r) => netIncome(r, a, fee) < company.incomeFloor).length;
    const viable = scenarioNpv > 0 && scenarioIrr !== null && scenarioIrr >= a.discountRate && income >= company.incomeFloor && fee >= minFee && fee <= maxFee;
    return { name, fee, npv: scenarioNpv, irr: scenarioIrr, payback: payback(f), income, routesBelow, viable };
  });
  // Recommend the viable scenario that leaves the fewest routes below the floor, then the highest NPV.
  const recommended = scenarios.filter((s) => s.viable).sort((x, y) => x.routesBelow - y.routesBelow || y.npv - x.npv)[0];

  return (
    <>
      <PageHeader
        title="Financial projection"
        lead="Whether scaling from 500 to 10,000 units returns enough for PT RES while every driver still takes home at least Rp 100,000 a day. Change any input and the results update."
      >
        <button type="button" className="button" onClick={reset} disabled={isDefault}>
          Reset inputs
        </button>
      </PageHeader>

      <div className="stats stats-top">
        <Stat label="Total initial investment" value={rpShort(total)} sub={`${num(company.targetFleet - company.pilotFleet)} additional units`} />
        <Stat label="Net present value" value={rpShort(projectNpv)} sub={`at a ${pct(a.discountRate, 1)} discount rate`} tone={projectNpv > 0 ? undefined : "bad"} />
        <Stat
          label="Internal rate of return"
          value={projectIrr === null ? "Not reached" : pct(projectIrr, 1)}
          sub={projectIrr !== null && projectIrr >= a.discountRate ? "Above the required return" : "Below the required return"}
          tone={projectIrr !== null && projectIrr >= a.discountRate ? undefined : "bad"}
        />
        <Stat
          label="Payback period"
          value={projectPayback === null ? "Not reached" : `${num(projectPayback, 1)} years`}
          sub={`within a ${a.horizonYears}-year horizon`}
          tone={projectPayback === null ? "bad" : undefined}
        />
      </div>

      <Panel title="Cumulative cash flow" note="Capital goes out phase by phase as routes are funded, then recurring fees bring it back.">
        <LineChart
          labels={flows.map((f) => `Y${f.year}`)}
          series={[{ name: "Cumulative cash flow", color: "#2E7D40", values: flows.map((f) => f.cumulative) }]}
          format={(v) => `Rp ${rpAxis(v)}`}
          height={260}
          ariaLabel="Cumulative project cash flow by year"
        />
      </Panel>

      <Panel title="Initial investment" note="Total investment = vehicle CAPEX + battery CAPEX + charging and swapping infrastructure + solar PV + ESS + digital infrastructure.">
        <div className="table-wrap">
          <table className="capex">
            <thead>
              <tr>
                <th>Component</th>
                <th>Quantity</th>
                <th>Unit cost</th>
                <th className="num">Total</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {a.capex.map((c) => (
                <tr key={c.key}>
                  <td className="strong">{c.label}</td>
                  <td>
                    <NumberField hideLabel label={`${c.label} quantity`} value={c.qty} suffix={c.unit} onChange={(v) => setCapex(c.key, "qty", v)} />
                  </td>
                  <td>
                    <NumberField hideLabel label={`${c.label} unit cost`} value={c.unitCost / 1e6} prefix="Rp" suffix="million" step={0.5} onChange={(v) => setCapex(c.key, "unitCost", v * 1e6)} />
                  </td>
                  <td className="num">{rpShort(c.qty * c.unitCost)}</td>
                  <td>
                    <span className="meter-cell">
                      <span className="meter">
                        <span className="meter-fill meter-good" style={{ width: `${total ? ((c.qty * c.unitCost) / total) * 100 : 0}%` }} />
                      </span>
                      <span>{pct(total ? (c.qty * c.unitCost) / total : 0)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="strong" colSpan={3}>
                  Total initial investment
                </td>
                <td className="num strong">{rpShort(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <Panel title="Operating assumptions">
        <div className="field-grid">
          <NumberField label="Battery rental fee" prefix="Rp" suffix="/ day" step={1000} value={a.rentalFee} onChange={(v) => set("rentalFee", v)} />
          <NumberField label="Vehicle and energy service fee" prefix="Rp" suffix="/ day" step={1000} value={a.serviceFee} onChange={(v) => set("serviceFee", v)} />
          <NumberField label="Operating days" suffix="/ year" value={a.operatingDays} onChange={(v) => set("operatingDays", v)} />
          <NumberField label="PT RES operating cost" suffix="% of revenue" value={Math.round(a.opexShare * 1000) / 10} onChange={(v) => set("opexShare", v / 100)} />
          <NumberField label="Discount rate" suffix="%" step={0.5} value={Math.round(a.discountRate * 1000) / 10} onChange={(v) => set("discountRate", v / 100)} />
          <NumberField label="Projection horizon" suffix="years" min={4} value={a.horizonYears} onChange={(v) => set("horizonYears", Math.max(4, Math.min(25, Math.round(v))))} />
          <NumberField
            label="Circular value recovery"
            suffix="% of battery cost"
            value={Math.round(a.salvageShare * 1000) / 10}
            onChange={(v) => set("salvageShare", v / 100)}
            hint="Second-life and recycling value at the end of the horizon"
          />
          <NumberField label="Battery operations" prefix="Rp" suffix="/ pack / day" step={500} value={a.batteryOpexPerDay} onChange={(v) => set("batteryOpexPerDay", v)} />
        </div>
      </Panel>

      <Panel
        title="Rental fee scenarios"
        note={`Workable range for the average driver: ${rp(minFee)} (PT RES minimum) to ${rp(maxFee)} (driver maximum).`}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Rental fee / day</th>
                <th className="num">Driver net income / day</th>
                <th className="num">Routes below floor</th>
                <th className="num">NPV</th>
                <th className="num">IRR</th>
                <th className="num">Payback</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.name}>
                  <td className="strong cap">{s.name}</td>
                  <td>
                    <NumberField hideLabel label={`${s.name} scenario fee`} prefix="Rp" step={1000} value={s.fee} onChange={(v) => setScenario(s.name, v)} />
                  </td>
                  <td className="num">{rp(s.income)}</td>
                  <td className="num">
                    {s.routesBelow} of {routes.length}
                  </td>
                  <td className="num">{rpShort(s.npv)}</td>
                  <td className="num">{s.irr === null ? "n/a" : pct(s.irr, 1)}</td>
                  <td className="num">{s.payback === null ? "Not reached" : `${num(s.payback, 1)} yrs`}</td>
                  <td>
                    {recommended && recommended.name === s.name ? (
                      <Badge tone="good">Recommended</Badge>
                    ) : s.viable ? (
                      <Badge tone="neutral">Viable</Badge>
                    ) : (
                      <Badge tone="bad">Not viable</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">
          A scenario is viable when NPV is positive, IRR meets the discount rate, the fee sits inside the workable range and the average driver earns at least{" "}
          {rp(company.incomeFloor)} a day. Among viable scenarios, the one that leaves the fewest routes below the floor is recommended; ties go to the higher NPV.
        </p>
      </Panel>
    </>
  );
}
