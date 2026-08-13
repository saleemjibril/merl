"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const empty = {
  name: "",
  description: "",
  unit: "number",
  direction: "increase",
  baselineValue: 0,
  requiresEvidence: false,
  resultNode: "",
};

export default function IndicatorModal({
  open,
  mode = "create",
  initial,
  nodes = [],
  onClose,
  onSave,
  busy,
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name || "",
        description: initial.description || "",
        unit: initial.unit || "number",
        direction: initial.direction || "increase",
        baselineValue: initial.baselineValue ?? 0,
        requiresEvidence: !!initial.requiresEvidence,
        resultNode: initial.resultNode?._id || initial.resultNode || "",
      });
    } else {
      setForm(empty);
    }
  }, [open, initial]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Modal
      open={open}
      title={mode === "edit" ? "Edit indicator" : "Add indicator"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            baselineValue: Number(form.baselineValue) || 0,
            resultNode: form.resultNode || null,
          });
        }}
      >
        <div className="grid grid-2">
          <div className="field">
            <label>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Logframe node</label>
            <select
              value={form.resultNode}
              onChange={(e) => set("resultNode", e.target.value)}
            >
              <option value="">Unassigned</option>
              {nodes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.level}: {n.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid grid-3">
          <div className="field">
            <label>Unit</label>
            <select value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option value="number">Number</option>
              <option value="percent">Percent</option>
              <option value="currency">Currency</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div className="field">
            <label>Direction</label>
            <select
              value={form.direction}
              onChange={(e) => set("direction", e.target.value)}
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="maintain">Maintain</option>
            </select>
          </div>
          <div className="field">
            <label>Baseline</label>
            <input
              type="number"
              value={form.baselineValue}
              onChange={(e) => set("baselineValue", e.target.value)}
            />
          </div>
        </div>
        <label className="row" style={{ marginBottom: 16, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.requiresEvidence}
            onChange={(e) => set("requiresEvidence", e.target.checked)}
          />
          Requires evidence before submit
        </label>
        <div className="row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create indicator"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
