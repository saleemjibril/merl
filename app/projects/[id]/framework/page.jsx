"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import LogframeTree, { NodeFormModal } from "../../../../components/LogframeTree";
import IndicatorModal from "../../../../components/IndicatorModal";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

export default function FrameworkPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [tree, setTree] = useState([]);
  const [flatNodes, setFlatNodes] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [modal, setModal] = useState(null);
  const [indicatorModal, setIndicatorModal] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateKey, setTemplateKey] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await api.get(`/projects/${id}/framework`);
    setTree(res.data.data.tree);
    setFlatNodes(res.data.data.flatNodes || []);
    setUnassigned(res.data.data.unassignedIndicators || []);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
    api.get("/templates").then((res) => setTemplates(res.data.data.templates));
  }, [id]);

  async function saveNode(payload) {
    try {
      if (modal?.mode === "edit") {
        await api.patch(`/projects/${id}/framework/nodes/${modal.node._id}`, payload);
      } else {
        await api.post(`/projects/${id}/framework/nodes`, payload);
      }
      toast.success("Saved");
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  }

  async function deleteNode(node) {
    if (!confirm(`Delete "${node.title}"?`)) return;
    try {
      await api.delete(`/projects/${id}/framework/nodes/${node._id}`);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  async function applyTemplate() {
    if (!templateKey) return;
    if (!confirm("This replaces the current logframe and indicators. Continue?")) return;
    try {
      await api.post(`/projects/${id}/framework/apply-template`, { templateKey });
      toast.success("Template applied");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function saveIndicator(payload) {
    setBusy(true);
    try {
      await api.post(`/projects/${id}/indicators`, payload);
      toast.success("Indicator added");
      setIndicatorModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(items) {
    try {
      await api.post(`/projects/${id}/framework/reorder`, { items });
    } catch (err) {
      toast.error(err.response?.data?.message || "Reorder failed");
      await load();
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Logframe</h1>
      <p className="muted">Full results tree: goal → outcome → output → activity.</p>
      <ProjectNav projectId={id} />

      {canEdit && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row">
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
            >
              <option value="">Apply sector template…</option>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn--sm" onClick={applyTemplate} disabled={!templateKey}>
              Apply template
            </button>
          </div>
        </div>
      )}

      <LogframeTree
        tree={tree}
        unassignedIndicators={unassigned}
        canEdit={canEdit}
        onAddRoot={() =>
          setModal({
            mode: "create",
            initial: { title: "", description: "", level: "goal", parent: "", sortOrder: 0 },
          })
        }
        onAddChild={(parent) =>
          setModal({
            mode: "create",
            initial: {
              title: "",
              description: "",
              level:
                parent.level === "goal"
                  ? "outcome"
                  : parent.level === "outcome"
                    ? "output"
                    : "activity",
              parent: parent._id,
              sortOrder: 0,
            },
          })
        }
        onEdit={(node) =>
          setModal({
            mode: "edit",
            node,
            initial: {
              title: node.title,
              description: node.description,
              level: node.level,
              parent: node.parent || "",
              sortOrder: node.sortOrder,
            },
          })
        }
        onDelete={deleteNode}
        onAddIndicator={(node) =>
          setIndicatorModal({
            resultNode: node._id,
          })
        }
        onReorder={reorder}
      />

      <NodeFormModal
        open={!!modal}
        title={modal?.mode === "edit" ? "Edit node" : "Add node"}
        initial={modal?.initial}
        parentOptions={flatNodes}
        onClose={() => setModal(null)}
        onSave={saveNode}
      />

      <IndicatorModal
        open={!!indicatorModal}
        mode="create"
        initial={{ resultNode: indicatorModal?.resultNode || "" }}
        nodes={flatNodes}
        onClose={() => setIndicatorModal(null)}
        onSave={saveIndicator}
        busy={busy}
      />
    </AppShell>
  );
}
