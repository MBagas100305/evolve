"use client";

import { useEffect, useRef, useState } from "react";

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceScale(min, max, count = 4) {
  if (max === min) max = min + 1;
  const raw = (max - min) / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || 10 * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.abs(v) < step / 1e6 ? 0 : v);
  return { lo, hi, ticks };
}

const M = { top: 14, right: 16, bottom: 28, left: 66 };

/**
 * Multi-series line chart with a crosshair tooltip.
 * series: [{ name, color, values, dash }]   refLines: [{ value, label }]
 */
export function LineChart({ labels, series, format = String, height = 280, refLines = [], tickEvery = 1, zero = true, ariaLabel }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const all = series.flatMap((s) => s.values).concat(refLines.map((r) => r.value));
  const { lo, hi, ticks } = niceScale(Math.min(zero ? 0 : Infinity, ...all), Math.max(...all));
  const w = Math.max(width - M.left - M.right, 10);
  const h = height - M.top - M.bottom;
  const n = labels.length;
  const x = (i) => M.left + (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v) => M.top + h - ((v - lo) / (hi - lo)) * h;
  const path = (values) => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left - M.left;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / w) * (n - 1)))));
  }

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className={t === 0 && lo < 0 ? "axis-zero" : "grid"} x1={M.left} x2={M.left + w} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % tickEvery === 0 ? (
              <text key={i} className="tick" x={x(i)} y={height - 8} textAnchor="middle">
                {l}
              </text>
            ) : null
          )}
          {refLines.map((r) => (
            <g key={r.label}>
              <line className="ref-line" x1={M.left} x2={M.left + w} y1={y(r.value)} y2={y(r.value)} />
              <text className="ref-label" x={M.left + 6} y={y(r.value) - 7}>
                {r.label}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash ? "6 5" : undefined} />
          ))}
          {hover !== null ? (
            <g>
              <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + h} />
              {series.map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          ) : null}
        </svg>
      ) : null}
      {hover !== null && width > 0 ? (
        <div className={`tooltip ${x(hover) > width / 2 ? "tooltip-left" : ""}`} style={{ left: x(hover), top: M.top }}>
          <p className="tooltip-title">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="tooltip-row">
              <span className="swatch" style={{ "--c": s.color }} aria-hidden="true" />
              <span>{s.name}</span>
              <strong>{format(s.values[hover])}</strong>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Vertical bar chart with per-bar tooltip.
 * data: [{ label, value, color, detail }]
 */
export function BarChart({ data, format = String, height = 240, tickEvery = 1, showValues = false, ariaLabel }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const { hi, ticks } = niceScale(0, Math.max(...data.map((d) => d.value), 1));
  const w = Math.max(width - M.left - M.right, 10);
  const top = M.top + (showValues ? 14 : 0);
  const h = height - top - M.bottom;
  const band = w / data.length;
  const barW = Math.max(2, Math.min(band - 2, 56));
  const y = (v) => top + h - (v / hi) * h;

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={M.left} x2={M.left + w} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = M.left + band * i + band / 2;
            const bh = Math.max(0, y(0) - y(d.value));
            const r = Math.min(4, barW / 2, bh);
            const x0 = cx - barW / 2;
            const yTop = y(d.value);
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={M.left + band * i} y={top} width={band} height={h} fill="transparent" />
                {bh > 0 ? (
                  <path
                    d={`M${x0},${y(0)}V${yTop + r}Q${x0},${yTop} ${x0 + r},${yTop}H${x0 + barW - r}Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r}V${y(0)}Z`}
                    fill={d.color}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                ) : null}
                {showValues ? (
                  <text className="bar-value" x={cx} y={yTop - 6} textAnchor="middle">
                    {format(d.value)}
                  </text>
                ) : null}
                {i % tickEvery === 0 ? (
                  <text className="tick" x={cx} y={height - 8} textAnchor="middle">
                    {d.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}
      {hover !== null && width > 0 ? (
        <div
          className={`tooltip ${M.left + band * hover > width / 2 ? "tooltip-left" : ""}`}
          style={{ left: M.left + band * hover + band / 2, top: M.top }}
        >
          <p className="tooltip-title">{data[hover].title ?? data[hover].label}</p>
          <p className="tooltip-row">
            <span className="swatch" style={{ "--c": data[hover].color }} aria-hidden="true" />
            <span>{data[hover].detail}</span>
            <strong>{format(data[hover].value)}</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}
