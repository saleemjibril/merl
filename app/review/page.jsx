"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

export default function ReviewQueuePage() {
  const [actuals, setActuals] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  async function load() {
    const res = await api.get("/review-queue");
    setActuals(res.data.data.actuals);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, []);

  async function approve(item) {
    try {
      await api.post(`/projects/${item.project._id}/actuals/${item._id}/review`, {
        decision: "approved",
      });
      toast.success("Approved");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function confirmReject() {
    if (!String(rejectReason).trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setRejectBusy(true);
    try {
      await api.post(
        `/projects/${rejectTarget.project._id}/actuals/${rejectTarget._id}/review`,
        {
          decision: "rejected",
          rejectionReason: rejectReason.trim(),
        }
      );
      toast.success("Rejected");
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRejectBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Review queue</h1>
      <p className="muted">Submitted actuals waiting for coordinator approval.</p>
      <div className="card" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Indicator</th>
              <th>Period</th>
              <th>Value</th>
              <th>By</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {actuals.map((a) => (
              <tr key={a._id}>
                <td>
                  <Link
                    href={`/projects/${a.project?._id}/data-entry?tab=submitted&entryId=${a._id}&periodId=${a.period?._id || a.period}`}
                  >
                    {a.project?.name}
                  </Link>
                </td>
                <td>{a.indicator?.name}</td>
                <td>{a.period?.name}</td>
                <td>{a.value}</td>
                <td>{a.enteredBy?.name}</td>
                <td className="row">
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => approve(a)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      setRejectTarget(a);
                      setRejectReason("");
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {actuals.length === 0 && <div className="empty">Queue is clear.</div>}
      </div>

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
