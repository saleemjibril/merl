"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import IndicatorModal from "../../../../components/IndicatorModal";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

export default function IndicatorsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [indicators, setIndicators] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [indRes, fwRes] = await Promise.all([
      api.get(`/projects/${id}/indicators`),
      api.get(`/projects/${id}/framework`),
    ]);
    setIndicators(indRes.data.data.indicators);
    setNodes(fwRes.data.data.flatNodes || []);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, [id]);

  async function saveIndicator(payload) {
    setBusy(true);
    try {
      if (modal?.mode === "edit") {
        await api.patch(`/projects/${id}/indicators/${modal.indicator._id}`, payload);
        toast.success("Indicator updated");
      } else {
        await api.post(`/projects/${id}/indicators`, payload);
        toast.success("Indicator created");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(ind) {
    if (!confirm(`Archive "${ind.name}"?`)) return;
    await api.delete(`/projects/${id}/indicators/${ind._id}`);
    toast.success("Archived");
    await load();
  }

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Indicators</h1>
          <p className="muted">Define what you measure against period targets.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn"
            onClick={() => setModal({ mode: "create", indicator: null })}
          >
            Add indicator
          </button>
        )}
      </div>
      <ProjectNav projectId={id} />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Node</th>
              <th>Unit</th>
              <th>Baseline</th>
              <th>Evidence</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind) => (
              <tr key={ind._id}>
                <td>{ind.name}</td>
                <td>{ind.resultNode?.title || "—"}</td>
                <td>{ind.unit}</td>
                <td>{ind.baselineValue}</td>
                <td>{ind.requiresEvidence ? "Yes" : "No"}</td>
                {canEdit && (
                  <td>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setModal({ mode: "edit", indicator: ind })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => remove(ind)}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {indicators.length === 0 && <div className="empty">No indicators yet.</div>}
      </div>

      <IndicatorModal
        open={!!modal}
        mode={modal?.mode || "create"}
        initial={
          modal?.mode === "create" && modal?.presetNode
            ? { ...modal.indicator, resultNode: modal.presetNode }
            : modal?.indicator
        }
        nodes={nodes}
        onClose={() => setModal(null)}
        onSave={saveIndicator}
        busy={busy}
      />
    </AppShell>
  );
}
