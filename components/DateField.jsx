"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid } from "date-fns";
import "react-day-picker/style.css";

function toIsoDate(d) {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

function fromValue(value) {
  if (!value) return undefined;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : undefined;
}

export default function DateField({ label, value, onChange, required, id }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = fromValue(value);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="field" ref={rootRef}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <div className="date-field">
        <button
          id={id}
          type="button"
          className="date-field__trigger"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{selected ? format(selected, "MMM d, yyyy") : "Select date"}</span>
          <span className="date-field__icons">
            {value ? (
              <span
                role="button"
                tabIndex={0}
                className="date-field__clear"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onChange("");
                  }
                }}
                aria-label="Clear date"
              >
                ×
              </span>
            ) : null}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
        </button>
        {required ? (
          <input
            tabIndex={-1}
            aria-hidden
            required
            value={value || ""}
            onChange={() => {}}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
          />
        ) : null}
        {open ? (
          <div className="date-field__popover">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                onChange(d ? toIsoDate(d) : "");
                setOpen(false);
              }}
              defaultMonth={selected}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
