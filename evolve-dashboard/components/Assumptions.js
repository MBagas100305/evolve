"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { defaultAssumptions } from "@/lib/data";

const AssumptionsContext = createContext(null);

/** Shares the editable financial assumptions between pages. */
export function AssumptionsProvider({ children }) {
  const [assumptions, setAssumptions] = useState(defaultAssumptions);

  const value = useMemo(
    () => ({
      assumptions,
      set: (key, v) => setAssumptions((a) => ({ ...a, [key]: v })),
      setCapex: (key, field, v) =>
        setAssumptions((a) => ({
          ...a,
          capex: a.capex.map((c) => (c.key === key ? { ...c, [field]: v } : c)),
        })),
      setScenario: (name, v) =>
        setAssumptions((a) => ({ ...a, rentalScenarios: { ...a.rentalScenarios, [name]: v } })),
      reset: () => setAssumptions(defaultAssumptions),
      isDefault: assumptions === defaultAssumptions,
    }),
    [assumptions]
  );

  return <AssumptionsContext.Provider value={value}>{children}</AssumptionsContext.Provider>;
}

export function useAssumptions() {
  const ctx = useContext(AssumptionsContext);
  if (!ctx) throw new Error("useAssumptions must be used inside AssumptionsProvider");
  return ctx;
}
