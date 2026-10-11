"use client";

import { useMemo, useState } from "react";
import { PageHeader, Panel, Badge, Meter, RangeField } from "@/components/ui";
import { BarChart } from "@/components/charts";
import { useAssumptions } from "@/components/Assumptions";
import { company, phases } from "@/lib/data";
import { scoreRoutes, netIncome } from "@/lib/finance";
import { num, rp, pct } from "@/lib/format";

export default function RoutesPage() {
  const { assumptions } = useAssumptions();
  const [weights, setWeights] = useState({ demand: 40, util: 35, margin: 25 });
  const setWeight = (key) => (v) => setWeights((w) => ({ ...w, [key]: v }));

  const ranked = useMemo(() => scoreRoutes(weights), [weights]);
  const total = weights.demand + weights.util + weights.margin || 1;

  const byPhase = [1, 2, 3].map((p) => {
    const list = ranked.filter((r) => r.phase === p);
    return {
      label: phases[p].name,
      title: `${phases[p].name}: ${list.map((r) => r.id).join(", ")}`,
      value: list.reduce((s, r) => s + r.planned, 0),
      color: "#2E7D40",
      detail: `${list.length} routes, units planned`,
    };
  });

  return (
    <>
      <PageHeader
        title="Route economics"
        lead="The Route Investment Pool funds routes in order of demand, utilisation and economic potential, so capital is released phase by phase instead of all at once."
      />

      <div className="two-col">
        <Panel title="How routes are scored" note="Move the weights to see the investment order change.">
          <RangeField label="Passenger demand" value={weights.demand} onChange={setWeight("demand")} min={0} max={100} step={5} display={pct(weights.demand / total)} />
          <RangeField label="Utilisation" value={weights.util} onChange={setWeight("util")} min={0} max={100} step={5} display={pct(weights.util / total)} />
          <RangeField label="Driver margin before fees" value={weights.margin} onChange={setWeight("margin")} min={0} max={100} step={5} display={pct(weights.margin / total)} />
        </Panel>
        <Panel title="Units funded per phase" note="Routes are added in score order until each phase reaches its fleet target.">
          <BarChart data={byPhase} format={(v) => num(v)} height={210} showValues ariaLabel="Units planned in each phase" />
        </Panel>
      </div>

      <Panel title="Investment order" note={`Driver net income uses the current fees: ${rp(assumptions.rentalFee)} battery rental and ${rp(assumptions.serviceFee)} service fee per day.`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="num">Rank</th>
                <th>Route</th>
                <th>Score</th>
                <th className="num">Passengers / vehicle / day</th>
                <th className="num">Utilisation</th>
                <th className="num">In service</th>
                <th className="num">Planned</th>
                <th className="num">Driver net income / day</th>
                <th>Phase</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const income = netIncome(r, assumptions);
                const ok = income >= company.incomeFloor;
                return (
                  <tr key={r.id}>
                    <td className="num">{r.rank}</td>
                    <td>
                      <span className="strong">{r.id}</span> {r.name}
                    </td>
                    <td>
                      <span className="meter-cell">
                        <Meter value={r.score} max={100} label={`Score ${num(r.score)} of 100`} />
                        <span>{num(r.score)}</span>
                      </span>
                    </td>
                    <td className="num">{num(r.pax)}</td>
                    <td className="num">{pct(r.util)}</td>
                    <td className="num">{r.deployed ? num(r.deployed) : "Not yet"}</td>
                    <td className="num">{num(r.planned)}</td>
                    <td className="num">
                      {rp(income)}
                      {ok ? "" : " ⚠"}
                    </td>
                    <td>
                      <Badge tone={r.phase === 1 ? "good" : "neutral"}>{phases[r.phase].name}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="footnote">⚠ marks routes where a driver would earn less than {rp(company.incomeFloor)} a day. See Driver income for the support that applies.</p>
      </Panel>
    </>
  );
}
