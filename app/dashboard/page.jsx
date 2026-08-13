"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import CountdownBadge from "../../components/CountdownBadge";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { canCoordinate } from "../../lib/status";

export default function DashboardPage() {
  const { user } = useAuth();
  const canManage = canCoordinate(user?.role);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/projects")
      .then((res) => setProjects(res.data.data.projects))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const atRisk = projects.filter(
    (p) => (p.summary?.atRisk || 0) + (p.summary?.offTrack || 0) + (p.summary?.missing || 0) > 0
  ).length;

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="muted">All active projects across your organization.</p>
        </div>
        {canManage && (
          <Link href="/projects/new" className="btn">
            New project
          </Link>
        )}
      </div>

      <div className="grid grid-3" style={{ margin: "20px 0 28px" }}>
        <div className="card">
          <div className="muted">Projects</div>
          <div className="metric-value">{loading ? "…" : projects.length}</div>
        </div>
        <div className="card">
          <div className="muted">Need attention</div>
          <div className="metric-value">{loading ? "…" : atRisk}</div>
        </div>
        <div className="card">
          <div className="muted">On track projects</div>
          <div className="metric-value">
            {loading ? "…" : Math.max(0, projects.length - atRisk)}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="empty">
          <p>No projects yet.</p>
          {canManage && (
            <Link href="/projects/new" className="btn" style={{ marginTop: 12 }}>
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-auto">
          {projects.map((p) => (
            <Link key={p._id} href={`/projects/${p._id}`} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="badge badge--muted">{p.sector}</span>
                <CountdownBadge countdown={p.summary?.countdown} />
              </div>
              <h3 style={{ marginTop: 12, fontSize: 20 }}>{p.name}</h3>
              <p className="muted" style={{ minHeight: 40 }}>
                {p.summary?.periodName
                  ? `Current period: ${p.summary.periodName}`
                  : "No reporting period yet"}
              </p>
              <div className="row" style={{ fontSize: 13, marginTop: 8 }}>
                <span className="badge badge--ok">{p.summary?.onTrack || 0} on track</span>
                <span className="badge badge--warn">{p.summary?.atRisk || 0} at risk</span>
                <span className="badge badge--danger">
                  {(p.summary?.offTrack || 0) + (p.summary?.missing || 0)} behind
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
