const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function num(n, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** Full rupiah amount: Rp 100,000 */
export function rp(n) {
  const sign = n < 0 ? "−" : "";
  return `${sign}Rp ${whole.format(Math.round(Math.abs(n)))}`;
}

/** Large rupiah amount in words: Rp 2.26 trillion */
export function rpShort(n) {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}Rp ${num(a / 1e12, 2)} trillion`;
  if (a >= 1e9) return `${sign}Rp ${num(a / 1e9, 1)} billion`;
  if (a >= 1e6) return `${sign}Rp ${num(a / 1e6, 1)} million`;
  return rp(n);
}

/** Compact axis label: 2.3T, 450B, 60k */
export function rpAxis(n) {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}${num(a / 1e12, 1)}T`;
  if (a >= 1e9) return `${sign}${num(a / 1e9, 0)}B`;
  if (a >= 1e6) return `${sign}${num(a / 1e6, 0)}M`;
  if (a >= 1e3) return `${sign}${num(a / 1e3, 0)}k`;
  return `${sign}${num(a)}`;
}

export function pct(x, digits = 0) {
  return `${num(x * 100, digits)}%`;
}
