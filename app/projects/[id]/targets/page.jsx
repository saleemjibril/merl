"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import DateField from "../../../../components/DateField";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

const EMPTY_REMINDER = { message: "", dueAt: "", indicatorId: "" };

export default function TargetsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [indicators, setIndicators] = useState([]);
  const [values, setValues] = useState({});
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState(EMPTY_REMINDER);

  async function loadReminders() {
    try {
      const res = await api.get(`/projects/${id}/reminders`);
      setReminders(res.data.data.reminders);
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/periods`),
      api.get(`/projects/${id}/indicators`),
    ]).then(([pRes, iRes]) => {
      const ps = pRes.data.data.periods;
      setPeriods(ps);
      setIndicators(iRes.data.data.indicators);
      if (ps[0]) setPeriodId(ps[0]._id);
    });
    loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function createReminder(e) {
    e.preventDefault();
    if (!reminderForm.message || !reminderForm.dueAt) {
      toast.error("Add a message and a due date");
      return;
    }
    try {
      await api.post(`/projects/${id}/reminders`, {
        message: reminderForm.message,
        dueAt: reminderForm.dueAt,
        indicatorId: reminderForm.indicatorId || undefined,
        periodId: periodId || undefined,
      });
      toast.success("Reminder set");
      setReminderForm(EMPTY_REMINDER);
      await loadReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set reminder");
    }
  }

  async function deleteReminder(reminderId) {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/projects/${id}/reminders/${reminderId}`);
      setReminders((prev) => prev.filter((r) => r._id !== reminderId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  useEffect(() => {
    if (!periodId) return;
    api.get(`/projects/${id}/targets?periodId=${periodId}`).then((res) => {
      const map = {};
      for (const t of res.data.data.targets) {
        map[String(t.indicator?._id || t.indicator)] = t.targetValue;
      }
      setValues(map);
    });
  }, [id, periodId]);

  async function save() {
    const targets = indicators.map((ind) => ({
      indicatorId: ind._id,
      periodId,
      targetValue: Number(values[ind._id] ?? 0),
    }));
    try {
      await api.put(`/projects/${id}/targets`, { targets });
      toast.success("Targets saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Targets</h1>
      <p className="muted">Set target values for each indicator in a period.</p>
      <ProjectNav projectId={id} />

      <div className="row" style={{ marginBottom: 16 }}>
        <select
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
        >
          {periods.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {canEdit && (
          <button type="button" className="btn" onClick={save}>
            Save targets
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Baseline</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind) => (
              <tr key={ind._id}>
                <td>{ind.name}</td>
                <td>{ind.baselineValue}</td>
                <td>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={values[ind._id] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [ind._id]: e.target.value }))
                    }
                    style={{
                      width: 120,
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {indicators.length === 0 && <div className="empty">Add indicators first.</div>}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 18 }}>Reminders</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Set a reminder for a target. When it&apos;s due, everyone on the project is
          notified.
        </p>

        {reminders.length > 0 && (
          <table className="table" style={{ marginBottom: canEdit ? 16 : 0 }}>
            <thead>
              <tr>
                <th>Due</th>
                <th>Target</th>
                <th>Message</th>
                <th>Status</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.dueAt).toLocaleDateString()}</td>
                  <td>{r.indicator?.name || "Whole project"}</td>
                  <td>{r.message}</td>
                  <td>
                    <span className={`badge ${r.sentAt ? "badge--ok" : "badge--warn"}`}>
                      {r.sentAt ? "sent" : "scheduled"}
                    </span>
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => deleteReminder(r._id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canEdit && (
          <form onSubmit={createReminder}>
            <div className="grid grid-2">
              <div className="field">
                <label>Target (optional)</label>
                <select
                  value={reminderForm.indicatorId}
                  onChange={(e) =>
                    setReminderForm((f) => ({ ...f, indicatorId: e.target.value }))
                  }
                >
                  <option value="">Whole project</option>
                  {indicators.map((ind) => (
                    <option key={ind._id} value={ind._id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>
              <DateField
                label="Due date"
                value={reminderForm.dueAt}
                onChange={(v) => setReminderForm((f) => ({ ...f, dueAt: v }))}
              />
            </div>
            <div className="field">
              <label>Message</label>
              <input
                type="text"
                placeholder="e.g. Please submit your Q2 figures"
                value={reminderForm.message}
                onChange={(e) =>
                  setReminderForm((f) => ({ ...f, message: e.target.value }))
                }
              />
            </div>
            <button type="submit" className="btn btn--sm">
              Set reminder
            </button>
          </form>
        )}
        {!canEdit && reminders.length === 0 && (
          <div className="empty">No reminders yet.</div>
        )}
      </div>
    </AppShell>
  );
}
