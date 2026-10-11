"use client";

export function PageHeader({ title, lead, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      {children ? <div className="page-actions">{children}</div> : null}
    </header>
  );
}

export function Panel({ title, note, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {title ? (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {note ? <p className="panel-note">{note}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ""}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub ? <p className="stat-sub">{sub}</p> : null}
    </div>
  );
}

const toneIcon = { good: "✓", warn: "!", bad: "✕", neutral: "•" };

/** Status badge: always icon + text, never colour alone. */
export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span aria-hidden="true">{toneIcon[tone]}</span>
      {children}
    </span>
  );
}

export function Meter({ value, max = 1, tone = "good", label }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="meter" role="img" aria-label={label}>
      <span className={`meter-fill meter-${tone}`} style={{ width: `${width}%` }} />
    </span>
  );
}

export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map((it) => (
        <li key={it.name}>
          <span className={it.dash ? "swatch swatch-dash" : "swatch"} style={{ "--c": it.color }} aria-hidden="true" />
          {it.name}
        </li>
      ))}
    </ul>
  );
}

export function NumberField({ label, value, onChange, step = 1, min = 0, prefix, suffix, hint, hideLabel }) {
  return (
    <label className="field">
      <span className={hideLabel ? "sr-only" : "field-label"}>{label}</span>
      <span className="field-box">
        {prefix ? <span className="affix">{prefix}</span> : null}
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
        />
        {suffix ? <span className="affix">{suffix}</span> : null}
      </span>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function RangeField({ label, value, onChange, min, max, step = 1, display }) {
  return (
    <label className="field range">
      <span className="field-label">
        {label}
        <strong>{display ?? value}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}
