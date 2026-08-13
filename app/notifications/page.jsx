"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_LABEL = {
  submission: "Submission",
  review: "Review",
  reminder: "Reminder",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/notifications");
      setItems(res.data.data.notifications);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function open(item) {
    try {
      if (!item.read) {
        await api.patch(`/notifications/${item._id}/read`);
        setItems((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
        );
      }
      if (item.link) router.push(item.link);
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked read");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="muted">Submissions, reviews, and reminders.</p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn btn--ghost" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        {loading ? (
          <div className="empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">You have no notifications yet.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((n) => (
              <li
                key={n._id}
                onClick={() => open(n)}
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--line)",
                  cursor: n.link ? "pointer" : "default",
                  background: n.read ? "transparent" : "var(--surface-2, #f2f7f5)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    marginTop: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: n.read ? "transparent" : "var(--brand, #1f7a5a)",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {n.body}
                  </div>
                  <span
                    className="badge badge--muted"
                    style={{ marginTop: 6, display: "inline-block", fontSize: 11 }}
                  >
                    {TYPE_LABEL[n.type] || n.type}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
