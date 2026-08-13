"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

export default function SharePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [links, setLinks] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [label, setLabel] = useState("Donor view");
  const [lastUrl, setLastUrl] = useState("");

  async function load() {
    const [lRes, pRes] = await Promise.all([
      api.get(`/projects/${id}/share-links`),
      api.get(`/projects/${id}/periods`),
    ]);
    setLinks(lRes.data.data.links);
    setPeriods(pRes.data.data.periods);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, [id]);

  async function create() {
    try {
      const res = await api.post(`/projects/${id}/share-links`, {
        label,
        periodId: periodId || undefined,
      });
      setLastUrl(res.data.data.url);
      toast.success("Share link created");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function revoke(linkId) {
    await api.delete(`/projects/${id}/share-links/${linkId}`);
    toast.success("Revoked");
    await load();
  }

  return (
    <AppShell>
      <h1 className="page-title">Share</h1>
      <p className="muted">Read-only donor / board links — no login required.</p>
      <ProjectNav projectId={id} />

      {canEdit && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid grid-2">
            <div className="field">
              <label>Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="field">
              <label>Period (optional)</label>
              <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
                <option value="">Current / latest</option>
                {periods.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="button" className="btn" onClick={create}>
            Create share link
          </button>
          {lastUrl && (
            <p className="muted" style={{ marginTop: 12, wordBreak: "break-all" }}>
              {lastUrl}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Token</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l._id}>
                <td>{l.label}</td>
                <td>
                  <a href={`/share/${l.token}`} target="_blank" rel="noreferrer">
                    /share/{l.token.slice(0, 8)}…
                  </a>
                </td>
                <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                <td>
                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => revoke(l._id)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {links.length === 0 && <div className="empty">No active share links.</div>}
      </div>
    </AppShell>
  );
}
