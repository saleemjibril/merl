"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import CountdownBadge from "../../../../components/CountdownBadge";
import StatusBadge from "../../../../components/StatusBadge";
import DateField from "../../../../components/DateField";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

export default function PeriodsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  async function load() {
    const res = await api.get(`/projects/${id}/periods`);
    setPeriods(res.data.data.periods);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/periods`, form);
      toast.success("Period created");
      setForm({ name: "", startDate: "", endDate: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function lock(period) {
    if (!confirm(`Lock "${period.name}"? Data entry will stop.`)) return;
    await api.post(`/projects/${id}/periods/${period._id}/lock`);
    toast.success("Period locked");
    await load();
  }

  return (
    <AppShell>
      <h1 className="page-title">Reporting periods</h1>
      <p className="muted">Quarters, payment periods, or custom reporting windows.</p>
      <ProjectNav projectId={id} />

      {canEdit && (
        <form className="card" onSubmit={onSubmit} style={{ marginBottom: 16 }}>
          <div className="grid grid-3">
            <div className="field">
              <label>Name</label>
              <input
                required
                placeholder="Q1 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <DateField
              label="Start"
              required
              value={form.startDate}
              onChange={(v) => setForm({ ...form, startDate: v })}
            />
            <DateField
              label="End"
              required
              value={form.endDate}
              onChange={(v) => setForm({ ...form, endDate: v })}
            />
          </div>
          <button className="btn" type="submit">
            Add period
          </button>
        </form>
      )}

      <div className="grid grid-auto">
        {periods.map((p) => (
          <div key={p._id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <StatusBadge status={p.lifecycle || p.status} />
              <CountdownBadge countdown={p.countdown} />
            </div>
            <h3 style={{ marginTop: 10, fontSize: 18 }}>{p.name}</h3>
            <p className="muted">
              {new Date(p.startDate).toLocaleDateString()} –{" "}
              {new Date(p.endDate).toLocaleDateString()}
            </p>
            {canEdit && p.status !== "locked" && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ marginTop: 10 }}
                onClick={() => lock(p)}
              >
                Lock period
              </button>
            )}
          </div>
        ))}
      </div>
      {periods.length === 0 && <div className="empty">No periods yet.</div>}
    </AppShell>
  );
}
