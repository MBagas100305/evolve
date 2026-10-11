"use client";

import { useState } from "react";
import { PageHeader, Panel, Stat, Badge, Meter, Legend, RangeField } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { company, loadProfile, terminals, gridCapacityKw } from "@/lib/data";
import { num, pct } from "@/lib/format";

const COLORS = { unmanaged: "#C2861B", managed: "#2E7D40", net: "#9CC53B" };

export default function EnergyPage() {
  const [fleet, setFleet] = useState(company.pilotFleet);
  const k = fleet / company.pilotFleet;
  const scaled = (arr) => arr.map((v) => Math.round(v * k));

  const unmanaged = scaled(loadProfile.unmanaged);
  const managed = scaled(loadProfile.managed);
  const net = scaled(loadProfile.managedNet);
  const solar = scaled(loadProfile.solar);

  const peakUnmanaged = Math.max(...unmanaged);
  const peakManaged = Math.max(...managed);
  const peakHour = loadProfile.hours[unmanaged.indexOf(peakUnmanaged)];
  const energy = unmanaged.reduce((s, v) => s + v, 0);
  const solarEnergy = managed.reduce((s, v, i) => s + Math.min(v, solar[i]), 0);
  const gapUnmanaged = Math.max(0, peakUnmanaged - gridCapacityKw);
  const gapManaged = Math.max(0, Math.max(...net) - gridCapacityKw);

  const series = [
    { name: "Unmanaged charging", color: COLORS.unmanaged, values: unmanaged, dash: true },
    { name: "With SmartCharge", color: COLORS.managed, values: managed },
    { name: "SmartCharge, net of SolarHub", color: COLORS.net, values: net },
  ];

  const kw = (v) => (v >= 10000 ? `${num(v / 1000, 1)} MW` : `${num(v)} kW`);

  return (
    <>
      <PageHeader
        title="Energy control"
        lead="Charging demand against available power. SmartCharge schedules charging and swapping around battery condition, vehicle schedules and grid capacity; SolarHub supplies part of the daytime load."
      />

      <Panel
        title="Daily charging load"
        note={`Fleet of ${num(fleet)} units. The dashed line shows what happens if every driver charges when their shift ends.`}
        action={
          <RangeField label="Fleet size" value={fleet} onChange={setFleet} min={500} max={10000} step={500} display={`${num(fleet)} units`} />
        }
      >
        <div className="stats">
          <Stat label="Peak without SmartCharge" value={kw(peakUnmanaged)} sub={`at ${peakHour}`} tone={gapUnmanaged > 0 ? "bad" : undefined} />
          <Stat label="Peak with SmartCharge" value={kw(peakManaged)} sub={`${pct(1 - peakManaged / peakUnmanaged)} lower`} />
          <Stat label="Energy from SolarHub" value={pct(solarEnergy / energy)} sub={`${num(solarEnergy / 1000, 1)} of ${num(energy / 1000, 1)} MWh a day`} />
          <Stat
            label="Extra grid capacity needed"
            value={gapManaged > 0 ? kw(gapManaged) : "None"}
            sub={gapUnmanaged > 0 ? `${kw(gapUnmanaged)} without SmartCharge` : "Also none without SmartCharge"}
            tone={gapManaged > 0 ? "warn" : undefined}
          />
        </div>
        <Legend items={series} />
        <LineChart
          labels={loadProfile.hours}
          series={series}
          format={(v) => (v >= 10000 ? `${num(v / 1000, 0)} MW` : `${num(v)} kW`)}
          tickEvery={3}
          refLines={[{ value: gridCapacityKw, label: `Grid capacity today, ${num(gridCapacityKw)} kW` }]}
          ariaLabel="Hourly charging load with and without SmartCharge"
        />
        <p className="footnote">
          Assumes SolarHub capacity grows in step with the fleet and grid capacity stays at today&rsquo;s level, so the gap shows how much new capacity each
          phase must secure.
        </p>
      </Panel>

      <Panel title="Terminals" note="Peak load per terminal for today's 500-unit fleet, compared with the terminal's grid connection.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Terminal</th>
                <th className="num">Grid</th>
                <th className="num">Unmanaged peak</th>
                <th>SmartCharge peak</th>
                <th className="num">Solar PV</th>
                <th className="num">ESS</th>
                <th className="num">Chargers / swap bays</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {terminals.map((t) => {
                const un = Math.round(t.share * Math.max(...loadProfile.unmanaged));
                const mg = Math.round(t.share * Math.max(...loadProfile.managed));
                const ok = mg <= t.gridKw;
                return (
                  <tr key={t.name}>
                    <td className="strong">{t.name}</td>
                    <td className="num">{num(t.gridKw)} kW</td>
                    <td className="num">
                      {num(un)} kW{un > t.gridKw ? " ⚠" : ""}
                    </td>
                    <td>
                      <span className="meter-cell">
                        <Meter value={mg} max={t.gridKw} tone={ok ? "good" : "bad"} label={`${num(mg)} of ${num(t.gridKw)} kW`} />
                        <span>{pct(mg / t.gridKw)}</span>
                      </span>
                    </td>
                    <td className="num">{t.solarKwp ? `${num(t.solarKwp)} kWp` : "Not suitable"}</td>
                    <td className="num">{num(t.essKwh)} kWh</td>
                    <td className="num">
                      {t.chargers} / {t.swapBays}
                    </td>
                    <td>
                      <Badge tone={ok ? "good" : "bad"}>{ok ? (un > t.gridKw ? "Protected by SmartCharge" : "Headroom") : "Overloaded"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
