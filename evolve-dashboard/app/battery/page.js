"use client";

import { useMemo, useState } from "react";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { BarChart } from "@/components/charts";
import { batteries, batteryRules, stages, stageOf, defaultAssumptions } from "@/lib/data";
import { num } from "@/lib/format";

const stageByKey = Object.fromEntries(stages.map((s) => [s.key, s]));
const tones = { first: "good", assess: "warn", second: "neutral", recycle: "bad" };
const nextStep = {
  first: "Keep in service",
  assess: "Test and classify",
  second: "Move to stationary storage",
  recycle: "Send for recycling",
};

export default function BatteryPage() {
  const [filter, setFilter] = useState("action");

  const counts = useMemo(() => {
    const c = { first: 0, assess: 0, second: 0, recycle: 0 };
    batteries.forEach((b) => (c[b.stage] += 1));
    return c;
  }, []);

  const histogram = useMemo(() => {
    const bins = [];
    for (let lo = 50; lo < 100; lo += 2) {
      const count = batteries.filter((b) => b.soh >= lo && b.soh < lo + 2).length;
      const stage = stageByKey[stageOf(lo)];
      bins.push({ label: `${lo}`, title: `SoH ${lo}–${lo + 2}%`, value: count, color: stage.color, detail: stage.label });
    }
    return bins;
  }, []);

  const rows = useMemo(() => {
    const list = filter === "action" ? batteries.filter((b) => b.stage !== "first") : batteries.filter((b) => b.stage === filter);
    return [...list].sort((a, b) => a.soh - b.soh).slice(0, 40);
  }, [filter]);
  const matching = filter === "action" ? batteries.length - counts.first : counts[filter];

  const secondLife = batteries.filter((b) => b.stage === "second");
  const secondLifeKwh = secondLife.reduce((s, b) => s + (batteryRules.packKwh * b.soh) / 100, 0);
  const essTarget = defaultAssumptions.capex.find((c) => c.key === "ess").qty;
  const avgSoh = batteries.reduce((s, b) => s + b.soh, 0) / batteries.length;

  return (
    <>
      <PageHeader
        title="Battery lifecycle"
        lead="The Battery Health Passport tracks State of Health for every pack, so each one is kept in vehicles, moved to storage or recycled at the right time. A degraded LFP pack is not waste by default."
      />

      <ol className="lifecycle" aria-label="Battery lifecycle stages">
        {stages.map((s) => (
          <li key={s.key} style={{ "--c": s.color }}>
            <p className="lifecycle-count">{num(counts[s.key])}</p>
            <p className="lifecycle-stage">{s.label}</p>
            <p className="lifecycle-meta">{s.initiative}</p>
            <p className="lifecycle-meta">{s.use}</p>
          </li>
        ))}
      </ol>

      <Panel
        title="State of Health across the fleet"
        note={`${num(batteries.length)} packs, average SoH ${num(avgSoh, 1)}%. Bars are coloured by the lifecycle stage each SoH band falls into.`}
      >
        <BarChart data={histogram} format={(v) => num(v)} tickEvery={5} height={250} ariaLabel="Number of battery packs by State of Health" />
        <p className="footnote">
          Stage thresholds: first life at {batteryRules.firstLifeMin}% SoH and above, assessment from {batteryRules.secondLifeMin}% to {batteryRules.firstLifeMin}%,
          second life from {batteryRules.recycleBelow}% to {batteryRules.secondLifeMin}%, recycling below {batteryRules.recycleBelow}%.
        </p>
      </Panel>

      <Panel
        title="Second-life storage"
        note="RES RePower reuses packs that are no longer optimal for vehicles as stationary storage, which reduces how much new ESS capacity PT RES has to buy."
      >
        <div className="split-facts">
          <p>
            <strong>{num(secondLifeKwh)} kWh</strong> usable today from {num(secondLife.length)} second-life packs
          </p>
          <p>
            <strong>{num(essTarget)} kWh</strong> of ESS planned for the scale-up
          </p>
          <p>
            <strong>{num((secondLifeKwh / essTarget) * 100, 1)}%</strong> of that plan already covered by reused packs
          </p>
        </div>
      </Panel>

      <Panel
        title="Battery Health Passport"
        note={`Showing ${num(rows.length)} of ${num(matching)} packs, lowest State of Health first.`}
        action={
          <div className="segmented" role="group" aria-label="Filter packs">
            {[
              ["action", "Needs a decision"],
              ["assess", "Assessment"],
              ["second", "Second life"],
              ["recycle", "End of life"],
              ["first", "First life"],
            ].map(([key, label]) => (
              <button key={key} type="button" className={filter === key ? "on" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        }
      >
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Location</th>
                  <th className="num">Cycles</th>
                  <th className="num">State of Health</th>
                  <th>Stage</th>
                  <th>Next step</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="strong">{b.id}</td>
                    <td>{b.location}</td>
                    <td className="num">{num(b.cycles)}</td>
                    <td className="num">{num(b.soh, 1)}%</td>
                    <td>
                      <Badge tone={tones[b.stage]}>{stageByKey[b.stage].label}</Badge>
                    </td>
                    <td>{nextStep[b.stage]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No packs are in this stage right now.</p>
        )}
      </Panel>
    </>
  );
}
