"use client";

import { useMemo } from "react";
import { getNigeriaLgas, getNigeriaStates } from "../lib/nigeria";

export default function LocationFields({ state, lga, onChange, disabled }) {
  const states = useMemo(() => getNigeriaStates(), []);
  const lgas = useMemo(() => getNigeriaLgas(state), [state]);

  return (
    <div className="grid grid-2">
      <div className="field">
        <label>State</label>
        <select
          disabled={disabled}
          value={state || ""}
          onChange={(e) =>
            onChange({
              state: e.target.value,
              lga: "",
            })
          }
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>LGA</label>
        <select
          disabled={disabled || !state}
          value={lga || ""}
          onChange={(e) =>
            onChange({
              state: state || "",
              lga: e.target.value,
            })
          }
        >
          <option value="">{state ? "Select LGA" : "Select state first"}</option>
          {lgas.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
