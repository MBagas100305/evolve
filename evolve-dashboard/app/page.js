"use client";

import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { useAssumptions } from "@/components/Assumptions";
import { company, phases, routes, batteries, loadProfile, gridCapacityKw, pillars } from "@/lib/data";
import { cashflows, npv, irr, payback, netIncome } from "@/lib/finance";
import { num, rp, rpShort, pct } from "@/lib/format";

export default function OverviewPage() {
  const { assumptions } = useAssumptions();

  const peakUnmanaged = Math.max(...loadProfile.unmanaged);
  const peakManaged = Math.max(...loadProfile.managedNet);
  const toAssess = batteries.filter((b) => b.stage === "assess").length;
  const toRepower = batteries.filter((b) => b.stage === "second").length;
  const toRecycle = batteries.filter((b) => b.stage === "recycle").length;
  const active = routes.filter((r) => r.deployed > 0);
  const below = active.filter((r) => netIncome(r, assumptions) < company.incomeFloor);
  const driversBelow = below.reduce((s, r) => s + r.deployed, 0);
  const flows = cashflows(assumptions);
  const projectNpv = npv(flows, assumptions.discountRate);
  const projectIrr = irr(flows);
  const projectPayback = payback(flows);
  const currentFleet = company.pilotFleet;

  const decisions = [
    {
      href: "/energy",
      area: "Energy control",
      tone: peakManaged <= gridCapacityKw ? "good" : "bad",
      status: peakManaged <= gridCapacityKw ? "Within capacity" : "Over capacity",
      text: `SmartCharge holds peak demand at ${num(peakManaged)} kW against ${num(gridCapacityKw)} kW of grid capacity. Unmanaged charging would peak at ${num(peakUnmanaged)} kW.`,
    },
    {
      href: "/battery",
      area: "Battery lifecycle",
      tone: toAssess + toRepower + toRecycle > 0 ? "warn" : "good",
      status: `${num(toAssess + toRepower + toRecycle)} packs need a decision`,
      text: `${num(toAssess)} packs are due for a health assessment, ${num(toRepower)} are candidates for RES RePower and ${num(toRecycle)} should go to RES ReCycle.`,
    },
    {
      href: "/drivers",
      area: "Driver income",
      tone: below.length ? "bad" : "good",
      status: below.length ? `${below.length} active ${below.length === 1 ? "route" : "routes"} below the floor` : "All active routes above the floor",
      text: below.length
        ? `${num(driversBelow)} drivers on ${below.map((r) => r.id).join(", ")} earn less than ${rp(company.incomeFloor)} a day at the current fees. Route Protection Fund support applies.`
        : `Every driver on an active route earns at least ${rp(company.incomeFloor)} a day at the current fees.`,
    },
    {
      href: "/finance",
      area: "Financial projection",
      tone: projectNpv > 0 ? "good" : "bad",
      status: projectNpv > 0 ? "Positive NPV" : "Negative NPV",
      text: `The scale-up returns an NPV of ${rpShort(projectNpv)}${projectIrr !== null ? `, an IRR of ${pct(projectIrr, 1)}` : ""}${projectPayback !== null ? ` and pays back in ${num(projectPayback, 1)} years` : " and does not pay back within the horizon"}.`,
    },
  ];

  return (
    <>
      <PageHeader
        title="From 500 to 10,000 electric angkot"
        lead="RES NEXUS brings energy, battery, route and driver-income data together so PT RES can decide where to expand next, and when."
      />

      <section className="journey" aria-label="Fleet scale-up plan">
        <ol className="stops">
          {phases.map((p) => {
            const reached = currentFleet >= p.fleet;
            return (
              <li key={p.name} className={reached ? "stop reached" : "stop"}>
                <span className="stop-dot" aria-hidden="true" />
                <p className="stop-fleet">{num(p.fleet)}</p>
                <p className="stop-name">
                  {p.name}
                  <span>{p.month === 0 ? "Today" : `Month ${p.month}`}</span>
                </p>
                <p className="stop-note">{p.note}</p>
              </li>
            );
          })}
        </ol>
        <p className="journey-foot">
          {num(currentFleet)} units in service today. {num(company.targetFleet - currentFleet)} more to deploy within {company.horizonMonths} months.
        </p>
      </section>

      <section className="facts" aria-label="Pilot results">
        <div>
          <p className="fact-value">−{pct(company.costSaving)}</p>
          <p className="fact-label">Driver operating cost compared with Pertalite, measured over the six-month pilot</p>
        </div>
        <div>
          <p className="fact-value">−{pct(company.emissionCut)}</p>
          <p className="fact-label">Local emissions over the same pilot period</p>
        </div>
        <div>
          <p className="fact-value">{rp(company.incomeFloor)}</p>
          <p className="fact-label">Minimum driver net income per day that every pricing decision must protect</p>
        </div>
      </section>

      <Panel title="What needs attention" note="Each line is computed from the module behind it. Open the module to act on it.">
        <ul className="decisions">
          {decisions.map((d) => (
            <li key={d.area}>
              <div className="decision-head">
                <Link href={d.href}>{d.area}</Link>
                <Badge tone={d.tone}>{d.status}</Badge>
              </div>
              <p>{d.text}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Strategy pillars" note="RES NEXUS is the fifth pillar: it connects the other four.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pillar</th>
                <th>Initiatives</th>
                <th>Module</th>
              </tr>
            </thead>
            <tbody>
              {pillars.map((p) => (
                <tr key={p.name}>
                  <td className="strong">{p.name}</td>
                  <td>{p.initiatives.join(", ")}</td>
                  <td>
                    <Link href={p.href}>{p.href === "/" ? "This page" : "Open"}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
