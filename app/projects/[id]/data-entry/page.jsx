"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import StatusBadge from "../../../../components/StatusBadge";
import Modal from "../../../../components/Modal";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate, canEdit } from "../../../../lib/status";

const REVIEW_STATUSES = ["submitted", "approved", "rejected"];

function DataEntryPageInner() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const editable = canEdit(user?.role);
  const reviewer = canCoordinate(user?.role);

  const initialTab = searchParams.get("tab") === "submitted" ? "submitted" : editable ? "make" : "submitted";
  const [tab, setTab] = useState(initialTab);
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [locked, setLocked] = useState(false);
  const [rows, setRows] = useState([]);
  /** entryId -> { value, narrative } */
  const [entryDrafts, setEntryDrafts] = useState({});
  /** entryId -> dirty flag (true if user edited since last load/save) */
  const [dirty, setDirty] = useState({});
  const [newDrafts, setNewDrafts] = useState({});
  const [newFiles, setNewFiles] = useState({});
  const [addKeys, setAddKeys] = useState({});
  const [evidenceByActual, setEvidenceByActual] = useState({});
  const [highlightId, setHighlightId] = useState(searchParams.get("entryId") || "");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);
  const periodIdRef = useRef("");
  const highlightRef = useRef(null);

  const isMine = (entry) => {
    if (!entry?.enteredBy || !user) return false;
    const by = entry.enteredBy._id || entry.enteredBy;
    return String(by) === String(user._id);
  };

  async function loadEvidence() {
    try {
      const res = await api.get(`/projects/${id}/evidence`);
      const map = {};
      for (const item of res.data.data.evidence || []) {
        const key = String(item.indicatorActual);
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
      setEvidenceByActual(map);
    } catch {
      // non-blocking
    }
  }

  async function loadMatrix(pid) {
    if (!pid) return;
    const res = await api.get(`/projects/${id}/entry-matrix?periodId=${pid}`);
    const nextRows = res.data.data.rows;
    setRows(nextRows);
    const period = res.data.data.period;
    setLocked(period?.status === "locked");
    const drafts = {};
    for (const row of nextRows) {
      for (const e of row.entries) {
        drafts[e._id] = { value: e.value ?? "", narrative: e.narrative || "" };
      }
    }
    setEntryDrafts(drafts);
    setDirty({});
    await loadEvidence();
  }

  useEffect(() => {
    const qpPeriod = searchParams.get("periodId");
    const qpTab = searchParams.get("tab");
    const qpEntry = searchParams.get("entryId");

    api.get(`/projects/${id}/periods`).then((res) => {
      const all = res.data.data.periods;
      setPeriods(all);
      const open = all.filter((p) => p.status !== "locked");
      const preferred =
        (qpPeriod && all.find((p) => String(p._id) === String(qpPeriod))) ||
        open[0] ||
        all[0];
      if (preferred) {
        setPeriodId(preferred._id);
        periodIdRef.current = preferred._id;
        loadMatrix(preferred._id);
      }
      if (qpTab === "submitted") setTab("submitted");
      if (qpEntry) setHighlightId(qpEntry);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    periodIdRef.current = periodId;
  }, [periodId]);

  // Scroll to highlighted entry once rows are loaded
  useEffect(() => {
    if (!highlightId || rows.length === 0) return;
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, rows, tab]);

  function updateDraft(entryId, patch) {
    setEntryDrafts((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], ...patch },
    }));
    setDirty((prev) => ({ ...prev, [entryId]: true }));
  }

  async function addEntry(indicatorId) {
    const d = newDrafts[indicatorId] || {};
    if (d.value === "" || d.value == null) {
      toast.error("Enter a value for the new entry");
      return;
    }
    try {
      const res = await api.post(`/projects/${id}/actuals`, {
        indicatorId,
        periodId: periodIdRef.current,
        value: Number(d.value),
        narrative: d.narrative || "",
      });
      const entryId = res.data.data.actual._id;

      const files = newFiles[indicatorId] || [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("actualId", entryId);
        await api.post(`/projects/${id}/evidence`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(
        files.length > 1 ? `Entry added with ${files.length} files` : "Entry added"
      );
      setNewDrafts((prev) => ({ ...prev, [indicatorId]: { value: "", narrative: "" } }));
      setNewFiles((prev) => ({ ...prev, [indicatorId]: [] }));
      setAddKeys((prev) => ({ ...prev, [indicatorId]: (prev[indicatorId] || 0) + 1 }));
      await loadMatrix(periodIdRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add entry");
    }
  }

  async function saveEntry(entryId) {
    const d = entryDrafts[entryId] || {};
    try {
      await api.patch(`/projects/${id}/actuals/${entryId}`, {
        value: d.value === "" ? null : Number(d.value),
        narrative: d.narrative,
      });
      toast.success("Draft saved");
      setDirty((prev) => ({ ...prev, [entryId]: false }));
      await loadMatrix(periodIdRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  }

  async function submitEntry(entryId) {
    try {
      // Persist any unsaved edits before submitting
      if (dirty[entryId]) {
        const d = entryDrafts[entryId] || {};
        await api.patch(`/projects/${id}/actuals/${entryId}`, {
          value: d.value === "" ? null : Number(d.value),
          narrative: d.narrative,
        });
      }
      const res = await api.post(`/projects/${id}/actuals/${entryId}/submit`);
      const autoApproved = res.data.data.autoApproved;
      toast.success(autoApproved ? "Submitted and approved" : "Submitted for review");
      setHighlightId(entryId);
      setTab("submitted");
      await loadMatrix(periodIdRef.current);
      router.replace(
        `/projects/${id}/data-entry?tab=submitted&entryId=${entryId}&periodId=${periodIdRef.current}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
    }
  }

  async function approveEntry(entryId) {
    try {
      await api.post(`/projects/${id}/actuals/${entryId}/review`, {
        decision: "approved",
      });
      toast.success("Approved");
      await loadMatrix(periodIdRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed");
    }
  }

  function openReject(entryId) {
    setRejectTarget(entryId);
    setRejectReason("");
  }

  async function confirmReject() {
    if (!String(rejectReason).trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setRejectBusy(true);
    try {
      await api.post(`/projects/${id}/actuals/${rejectTarget}/review`, {
        decision: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      toast.success("Rejected");
      setRejectTarget(null);
      setRejectReason("");
      await loadMatrix(periodIdRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed");
    } finally {
      setRejectBusy(false);
    }
  }

  async function removeEntry(entryId) {
    if (!confirm("Delete this entry and its evidence?")) return;
    try {
      await api.delete(`/projects/${id}/actuals/${entryId}`);
      toast.success("Entry deleted");
      await loadMatrix(periodIdRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  async function uploadEvidence(entryId, file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("actualId", entryId);
    try {
      const res = await api.post(`/projects/${id}/evidence`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const evidence = res.data.data.evidence;
      setEvidenceByActual((prev) => ({
        ...prev,
        [String(entryId)]: [...(prev[String(entryId)] || []), evidence],
      }));
      toast.success("Evidence uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  }

  async function downloadEvidence(evidenceId, fileName) {
    try {
      const res = await api.get(`/projects/${id}/evidence/${evidenceId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  async function removeEvidenceFile(entryId, evidenceId) {
    if (!confirm("Remove this evidence file?")) return;
    try {
      await api.delete(`/projects/${id}/evidence/${evidenceId}`);
      setEvidenceByActual((prev) => ({
        ...prev,
        [String(entryId)]: (prev[String(entryId)] || []).filter((e) => e._id !== evidenceId),
      }));
      toast.success("Evidence removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  function EvidenceList({ entry, allowRemove }) {
    const files = evidenceByActual[String(entry._id)] || [];
    if (files.length === 0) return null;
    return (
      <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
        {files.map((ev) => (
          <li key={ev._id} style={{ marginBottom: 4 }}>
            <span style={{ marginRight: 10 }}>{ev.fileName}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => downloadEvidence(ev._id, ev.fileName)}
            >
              Download
            </button>
            {allowRemove && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => removeEvidenceFile(entry._id, ev._id)}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  function IndicatorHeader({ row }) {
    const ind = row.indicator;
    const reported = row.aggregate?.value;
    const pendingValue = row.aggregate?.pendingValue;
    const pendingCount = row.aggregate?.counts?.submitted || 0;
    return (
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 17 }}>{ind.name}</h3>
          <p className="muted">
            Target: {row.target?.targetValue ?? "—"} · Baseline: {ind.baselineValue}
            {ind.requiresEvidence ? " · Evidence required" : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={row.progress?.status} />
          <div className="metric-value" style={{ fontSize: 22, marginTop: 6 }}>
            {reported == null ? "—" : Number(reported).toLocaleString()}
            {row.target?.targetValue != null && (
              <span style={{ fontSize: 14, color: "var(--ink-muted)", fontWeight: 500 }}>
                {" "}
                / {Number(row.target.targetValue).toLocaleString()}
              </span>
            )}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {row.progress?.percent != null ? `${row.progress.percent}% approved` : "No target"}
            {pendingCount > 0
              ? ` · ${pendingValue != null ? Number(pendingValue).toLocaleString() : pendingCount} awaiting review`
              : ""}
          </div>
        </div>
      </div>
    );
  }

  function entryShellStyle(entryId) {
    const highlighted = String(highlightId) === String(entryId);
    return {
      background: "var(--surface-2, #f7faf9)",
      padding: 14,
      marginBottom: 10,
      outline: highlighted ? "2px solid var(--brand, #1f7a5a)" : undefined,
      boxShadow: highlighted ? "0 0 0 4px rgba(31,122,90,0.15)" : undefined,
    };
  }

  function EditableEntry({ entry }) {
    const d = entryDrafts[entry._id] || { value: "", narrative: "" };
    const isDirty = !!dirty[entry._id];
    const disabled = locked;
    return (
      <div
        ref={String(highlightId) === String(entry._id) ? highlightRef : null}
        className="card"
        style={entryShellStyle(entry._id)}
      >
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <strong style={{ fontSize: 14 }}>Your entry</strong>
          <StatusBadge status={entry.status} />
        </div>
        {entry.status === "rejected" && entry.rejectionReason && (
          <p className="muted" style={{ color: "var(--danger)", marginBottom: 8 }}>
            Rejected: {entry.rejectionReason}
          </p>
        )}
        <div className="grid grid-2">
          <div className="field">
            <label>Value</label>
            <input
              type="number"
              disabled={disabled}
              value={d.value ?? ""}
              onChange={(e) => updateDraft(entry._id, { value: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Add evidence</label>
            <input
              type="file"
              multiple
              disabled={disabled}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((file) => uploadEvidence(entry._id, file));
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="field">
          <label>Narrative</label>
          <textarea
            rows={3}
            disabled={disabled}
            value={d.narrative ?? ""}
            onChange={(e) => updateDraft(entry._id, { narrative: e.target.value })}
          />
        </div>
        <EvidenceList entry={entry} allowRemove={!disabled} />
        <div className="row">
          {!disabled && (
            <>
              <button
                type="button"
                className="btn btn--sm"
                disabled={!isDirty}
                onClick={() => saveEntry(entry._id)}
              >
                {isDirty ? "Save draft" : "Saved"}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => submitEntry(entry._id)}
              >
                {entry.status === "rejected" ? "Resubmit" : reviewer ? "Submit" : "Submit for review"}
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                style={{ marginLeft: "auto" }}
                onClick={() => removeEntry(entry._id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function ReviewEntry({ entry }) {
    const canReviewThis = !locked && reviewer && !isMine(entry) && entry.status === "submitted";
    const canDeleteThis = !locked && user?.role === "owner";
    return (
      <div
        ref={String(highlightId) === String(entry._id) ? highlightRef : null}
        id={`entry-${entry._id}`}
        className="card"
        style={entryShellStyle(entry._id)}
      >
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <strong style={{ fontSize: 14 }}>
            {entry.enteredBy?.name || "Unknown"}
            {isMine(entry) ? " (you)" : ""}
          </strong>
          <StatusBadge status={entry.status} />
        </div>
        <div className="row" style={{ gap: 24, marginBottom: 8 }}>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>
              Value
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {entry.value == null ? "—" : Number(entry.value).toLocaleString()}
            </div>
          </div>
          {entry.narrative && (
            <div style={{ flex: 1 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Narrative
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{entry.narrative}</div>
            </div>
          )}
        </div>
        {entry.status === "rejected" && entry.rejectionReason && (
          <p className="muted" style={{ color: "var(--danger)", marginBottom: 8 }}>
            Rejected: {entry.rejectionReason}
          </p>
        )}
        <EvidenceList entry={entry} allowRemove={false} />
        {(canReviewThis || canDeleteThis) && (
          <div className="row">
            {canReviewThis && (
              <>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => approveEntry(entry._id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => openReject(entry._id)}
                >
                  Reject
                </button>
              </>
            )}
            {canDeleteThis && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                style={{ marginLeft: canReviewThis ? "auto" : undefined }}
                onClick={() => removeEntry(entry._id)}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const showMakeTab = editable;

  return (
    <AppShell>
      <h1 className="page-title">Data entry</h1>
      <p className="muted">
        Add your contributions toward each indicator. Reported totals are the sum of
        approved entries only.
      </p>
      <ProjectNav projectId={id} />

      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 6 }}>
          {showMakeTab && (
            <button
              type="button"
              className={`btn btn--sm ${tab === "make" ? "" : "btn--ghost"}`}
              onClick={() => setTab("make")}
            >
              Make entries
            </button>
          )}
          <button
            type="button"
            className={`btn btn--sm ${tab === "submitted" ? "" : "btn--ghost"}`}
            onClick={() => setTab("submitted")}
          >
            {reviewer ? "Review entries" : "Submitted entries"}
          </button>
        </div>
        <select
          value={periodId}
          onChange={(e) => {
            setPeriodId(e.target.value);
            periodIdRef.current = e.target.value;
            loadMatrix(e.target.value);
          }}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
        >
          {periods.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.status})
            </option>
          ))}
        </select>
      </div>

      {locked && (
        <div className="empty" style={{ marginBottom: 16 }}>
          This period is locked. Entries are read-only.
        </div>
      )}

      {tab === "make" && showMakeTab && (
        <div className="stack">
          {rows.map((row) => {
            const ind = row.indicator;
            const nd = newDrafts[ind._id] || { value: "", narrative: "" };
            const myEntries = row.entries.filter(
              (e) => isMine(e) && (e.status === "draft" || e.status === "rejected")
            );
            return (
              <div key={ind._id} className="card">
                <IndicatorHeader row={row} />
                <div style={{ marginTop: 14 }}>
                  {myEntries.map((entry) => (
                    <EditableEntry key={entry._id} entry={entry} />
                  ))}
                </div>
                {!locked && (
                  <div
                    className="card"
                    style={{ padding: 14, border: "1px dashed var(--line)", background: "transparent" }}
                  >
                    <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                      Add a new entry
                    </div>
                    <div className="grid grid-2">
                      <div className="field">
                        <label>Value</label>
                        <input
                          type="number"
                          placeholder="e.g. 10"
                          value={nd.value}
                          onChange={(e) =>
                            setNewDrafts((prev) => ({
                              ...prev,
                              [ind._id]: { ...prev[ind._id], value: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>
                          Evidence{ind.requiresEvidence ? " (required)" : " (optional)"}
                        </label>
                        <input
                          key={addKeys[ind._id] || 0}
                          type="file"
                          multiple
                          onChange={(e) =>
                            setNewFiles((prev) => ({
                              ...prev,
                              [ind._id]: Array.from(e.target.files || []),
                            }))
                          }
                        />
                        {(newFiles[ind._id]?.length || 0) > 0 && (
                          <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                            {newFiles[ind._id].length} file
                            {newFiles[ind._id].length > 1 ? "s" : ""} selected
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="field">
                      <label>Narrative (optional)</label>
                      <textarea
                        rows={3}
                        placeholder="What did you achieve?"
                        value={nd.narrative || ""}
                        onChange={(e) =>
                          setNewDrafts((prev) => ({
                            ...prev,
                            [ind._id]: { ...prev[ind._id], narrative: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <button type="button" className="btn btn--sm" onClick={() => addEntry(ind._id)}>
                      Add entry
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && <div className="empty">Select a period with indicators.</div>}
        </div>
      )}

      {tab === "submitted" && (
        <div className="stack">
          {!reviewer && (
            <p className="muted">You can view the entries you have submitted below.</p>
          )}
          {rows.map((row) => {
            const list = row.entries.filter((e) => {
              if (!REVIEW_STATUSES.includes(e.status)) return false;
              return reviewer || isMine(e);
            });
            return (
              <div key={row.indicator._id} className="card">
                <IndicatorHeader row={row} />
                <div style={{ marginTop: 14 }}>
                  {list.length === 0 ? (
                    <p className="muted">No submitted entries yet.</p>
                  ) : (
                    list.map((entry) => <ReviewEntry key={entry._id} entry={entry} />)
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div className="empty">Select a period with indicators.</div>}
        </div>
      )}

      <Modal
        open={!!rejectTarget}
        title="Reject entry"
        onClose={() => {
          if (!rejectBusy) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <p className="muted" style={{ marginBottom: 12 }}>
          Tell the contributor why this entry is being rejected so they can fix it.
        </p>
        <div className="field">
          <label>Reason for rejection</label>
          <textarea
            rows={4}
            autoFocus
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Evidence does not match the reported figure"
          />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn--danger"
            disabled={rejectBusy}
            onClick={confirmReject}
          >
            {rejectBusy ? "Rejecting…" : "Reject entry"}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={rejectBusy}
            onClick={() => {
              setRejectTarget(null);
              setRejectReason("");
            }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}

export default function DataEntryPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="muted">Loading…</p>
        </AppShell>
      }
    >
      <DataEntryPageInner />
    </Suspense>
  );
}
