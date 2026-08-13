"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../components/AppShell";
import ProjectNav from "../../../components/ProjectNav";
import CountdownBadge from "../../../components/CountdownBadge";
import StatusBadge from "../../../components/StatusBadge";
import { api } from "../../../lib/api";

export default function ProjectDashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [periodId, setPeriodId] = useState("");

  async function load(pid) {
    try {
      const q = pid ? `?periodId=${pid}` : "";
      const res = await api.get(`/projects/${id}/dashboard${q}`);
      setData(res.data.data);
      if (res.data.data.period?._id) setPeriodId(res.data.data.period._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard");
    }
  }

  useEffect(() => {
    load("");
  }, [id]);

  if (!data) {
    return (
      <AppShell>
        <p className="muted">Loading dashboard…</p>
      </AppShell>
    );
  }

  const { project, period, periods, counts, cards } = data;

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="muted">{project.description || "Project monitoring dashboard"}</p>
        </div>
        <div className="row">
          <select
            value={periodId}
            onChange={(e) => {
              setPeriodId(e.target.value);
              load(e.target.value);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--line)",
            }}
          >
            {periods.length === 0 && <option value="">No periods</option>}
            {periods.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          {period?.countdown && <CountdownBadge countdown={period.countdown} />}
        </div>
      </div>
      <ProjectNav projectId={id} />

      <div className="grid grid-auto" style={{ marginBottom: 20 }}>
        {[
          ["Indicators", counts.total],
          ["Achieved", counts.achieved],
          ["On track", counts.onTrack],
          ["At risk", counts.atRisk],
          ["Off track", counts.offTrack],
          ["Missing", counts.missing],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <div className="muted">{label}</div>
            <div className="metric-value">{value}</div>
          </div>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="empty">
          Add indicators (or apply a template) and a reporting period to see progress cards.
        </div>
      ) : (
        <div className="grid grid-auto">
          {cards.map((c) => (
            <div key={c.indicatorId} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {c.resultNode?.title || "Unassigned"}
                </span>
                <StatusBadge status={c.progress?.status} />
              </div>
              <h3 style={{ fontSize: 17, marginTop: 8 }}>{c.name}</h3>
              <div className="metric-value" style={{ marginTop: 10 }}>
                {c.actual == null ? "—" : Number(c.actual).toLocaleString()}
                {c.target != null && (
                  <span style={{ fontSize: 16, color: "var(--ink-muted)", fontWeight: 500 }}>
                    {" "}
                    / {Number(c.target).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {c.progress?.percent != null ? `${c.progress.percent}% of target` : "No target set"}
                {c.actualStatus ? ` · ${c.actualStatus}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
