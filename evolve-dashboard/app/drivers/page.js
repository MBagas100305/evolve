"use client";

import { useState } from "react";
import { PageHeader, Panel, Badge, NumberField } from "@/components/ui";
import { useAssumptions } from "@/components/Assumptions";
import { company, routes } from "@/lib/data";
import { averageDriver, maxRentalFee, minRentalFee, netIncome } from "@/lib/finance";
import { num, rp } from "@/lib/format";

export default function DriversPage() {
  const { assumptions, set } = useAssumptions();
  const [profile, setProfile] = useState("avg");

  const driver = profile === "avg" ? averageDriver() : routes.find((r) => r.id === profile);
  const fee = assumptions.rentalFee;
  const minFee = minRentalFee(assumptions);
  const maxFee = maxRentalFee(driver, assumptions);
  const income = netIncome(driver, assumptions);
  const feasible = maxFee >= minFee;
  const inRange = feasible && fee >= minFee && fee <= maxFee;

  const scaleMax = Math.max(maxFee, minFee, fee, 1) * 1.15;
  const pos = (v) => `${Math.max(0, Math.min(100, (v / scaleMax) * 100))}%`;

  let verdict;
  if (!feasible) verdict = { tone: "bad", label: "No workable fee", text: "The lowest fee PT RES can accept is higher than the most this driver can afford. This route needs Route Protection Fund support or a review before it is funded." };
  else if (fee < minFee) verdict = { tone: "warn", label: "Too low for PT RES", text: `Raise the fee to at least ${rp(Math.ceil(minFee / 500) * 500)} to recover the battery investment.` };
  else if (fee > maxFee) verdict = { tone: "bad", label: "Too high for the driver", text: `Lower the fee to ${rp(Math.floor(maxFee / 500) * 500)} or less to keep net income at ${rp(company.incomeFloor)} a day.` };
  else verdict = { tone: "good", label: "Inside the workable range", text: `The driver keeps ${rp(income - company.incomeFloor)} a day above the income floor and PT RES recovers its battery investment.` };

  const active = routes.filter((r) => r.deployed > 0);
  const shortfalls = active
    .map((r) => ({ ...r, gap: company.incomeFloor - netIncome(r, assumptions) }))
    .filter((r) => r.gap > 0);
  const dailyFund = shortfalls.reduce((s, r) => s + r.gap * r.deployed, 0);
  const driversSupported = shortfalls.reduce((s, r) => s + r.deployed, 0);

  return (
    <>
      <PageHeader
        title="Driver income"
        lead={`RES Income Shield sets the battery rental fee so that a driver's net income never falls below ${rp(company.incomeFloor)} a day. The Route Protection Fund covers temporary shortfalls.`}
      />

      <Panel
        title="Rental fee simulator"
        note="Maximum rental fee = daily driver revenue − operating costs − Rp 100,000. The minimum is what PT RES needs to recover the battery investment."
        action={
          <label className="field select">
            <span className="field-label">Driver profile</span>
            <select value={profile} onChange={(e) => setProfile(e.target.value)}>
              <option value="avg">Network average</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} {r.name}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <div className="sim">
          <div className="sim-inputs">
            <NumberField label="Battery rental fee" prefix="Rp" suffix="/ day" step={1000} value={fee} onChange={(v) => set("rentalFee", v)} />
            <NumberField label="Vehicle and energy service fee" prefix="Rp" suffix="/ day" step={1000} value={assumptions.serviceFee} onChange={(v) => set("serviceFee", v)} />
            <dl className="ledger">
              <div>
                <dt>Daily revenue</dt>
                <dd>{rp(driver.revenue)}</dd>
              </div>
              <div>
                <dt>Energy</dt>
                <dd>{rp(-driver.energy)}</dd>
              </div>
              <div>
                <dt>Other operating costs</dt>
                <dd>{rp(-driver.other)}</dd>
              </div>
              <div>
                <dt>Service fee</dt>
                <dd>{rp(-assumptions.serviceFee)}</dd>
              </div>
              <div>
                <dt>Battery rental</dt>
                <dd>{rp(-fee)}</dd>
              </div>
              <div className="ledger-total">
                <dt>Driver net income</dt>
                <dd>{rp(income)}</dd>
              </div>
            </dl>
          </div>

          <div className="sim-result">
            <Badge tone={verdict.tone}>{verdict.label}</Badge>
            <p className="sim-text">{verdict.text}</p>

            <div className="feebar" role="img" aria-label={`Fee ${rp(fee)}. Workable range ${rp(minFee)} to ${rp(maxFee)}.`}>
              <div className="feebar-track">
                {feasible ? <span className="feebar-range" style={{ left: pos(minFee), width: `calc(${pos(maxFee)} - ${pos(minFee)})` }} /> : null}
                <span className={`feebar-marker ${inRange ? "" : "out"}`} style={{ left: pos(fee) }} />
              </div>
            </div>
            <dl className="feebar-key">
              <div>
                <dt>PT RES minimum</dt>
                <dd>{rp(minFee)}</dd>
              </div>
              <div>
                <dt>Current fee</dt>
                <dd>{rp(fee)}</dd>
              </div>
              <div>
                <dt>Driver maximum</dt>
                <dd>{maxFee > 0 ? rp(maxFee) : "None"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Panel>

      <Panel
        title="Route Protection Fund"
        note="Conditional support for drivers on active routes whose income falls short. Three or more weeks below the floor in a month triggers a route evaluation."
      >
        <div className="split-facts">
          <p>
            <strong>{num(driversSupported)}</strong> drivers eligible for support today
          </p>
          <p>
            <strong>{rp(dailyFund)}</strong> top-up needed per day
          </p>
          <p>
            <strong>{rp((dailyFund * assumptions.operatingDays) / 12)}</strong> per month at {num(assumptions.operatingDays)} operating days a year
          </p>
        </div>
      </Panel>

      <Panel title="Income by route" note="Every route at the current fees. Routes not yet in service use survey estimates.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th className="num">Drivers</th>
                <th className="num">Daily revenue</th>
                <th className="num">Operating costs</th>
                <th className="num">Highest affordable rental</th>
                <th className="num">Net income / day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => {
                const net = netIncome(r, assumptions);
                const max = maxRentalFee(r, assumptions);
                let badge;
                if (net >= company.incomeFloor) badge = <Badge tone="good">Protected</Badge>;
                else if (r.deployed === 0) badge = <Badge tone="warn">Review before funding</Badge>;
                else if (r.weeksBelow >= 3) badge = <Badge tone="bad">Route under evaluation</Badge>;
                else badge = <Badge tone="warn">Fund support</Badge>;
                return (
                  <tr key={r.id}>
                    <td>
                      <span className="strong">{r.id}</span> {r.name}
                    </td>
                    <td className="num">{r.deployed ? num(r.deployed) : "Not yet"}</td>
                    <td className="num">{rp(r.revenue)}</td>
                    <td className="num">{rp(r.energy + r.other + assumptions.serviceFee)}</td>
                    <td className="num">{max > 0 ? rp(max) : "None"}</td>
                    <td className="num strong">{rp(net)}</td>
                    <td>{badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="footnote">Operating costs include energy, other daily costs and the service fee, before battery rental.</p>
      </Panel>
    </>
  );
}
