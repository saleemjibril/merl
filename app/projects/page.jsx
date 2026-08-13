"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { canCoordinate } from "../../lib/status";

export default function ProjectsPage() {
  const { user } = useAuth();
  const canManage = canCoordinate(user?.role);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api
      .get("/projects")
      .then((res) => setProjects(res.data.data.projects))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load"));
  }, []);

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="muted">Open a project to manage its logframe and reporting.</p>
        </div>
        {canManage && (
          <Link href="/projects/new" className="btn">
            New project
          </Link>
        )}
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sector</th>
              <th>Indicators</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p._id}>
                <td>
                  <Link href={`/projects/${p._id}`} style={{ fontWeight: 600, color: "var(--brand)" }}>
                    {p.name}
                  </Link>
                </td>
                <td>{p.sector}</td>
                <td>{p.summary?.indicatorCount ?? "—"}</td>
                <td>{p.summary?.periodName || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <div className="empty">No projects yet.</div>}
      </div>
    </AppShell>
  );
}
