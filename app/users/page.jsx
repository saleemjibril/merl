"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { canCoordinate } from "../../lib/status";

export default function UsersPage() {
  const { user } = useAuth();
  const canManage = canCoordinate(user?.role);
  const isOwner = user?.role === "owner";
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/org");
      setMembers(res.data.data.members || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    load();
  }, [canManage]);

  function canToggle(member) {
    if (!canManage) return false;
    if (String(member._id) === String(user._id)) return false;
    if (member.role === "owner") return false;
    if (isOwner) return ["coordinator", "contributor", "viewer"].includes(member.role);
    // Coordinators: contributors and viewers only
    return ["contributor", "viewer"].includes(member.role);
  }

  async function setActive(member, isActive) {
    const action = isActive ? "reactivate" : "suspend";
    if (!confirm(`${action[0].toUpperCase() + action.slice(1)} ${member.name}'s account?`)) {
      return;
    }
    try {
      await api.patch(`/org/members/${member._id}/status`, { isActive });
      toast.success(isActive ? "Account reactivated" : "Account suspended");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  if (!canManage) {
    return (
      <AppShell>
        <h1 className="page-title">Users</h1>
        <div className="empty">You do not have permission to view users.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="page-title">Users</h1>
      <p className="muted">
        All accounts in your organization.
        {isOwner
          ? " As owner you can suspend coordinators and contributors."
          : " As coordinator you can suspend contributors."}
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        {loading ? (
          <div className="empty">Loading…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>
                    {m.name}
                    {String(m._id) === String(user._id) ? " (you)" : ""}
                  </td>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td>
                    <span className={`badge ${m.isActive ? "badge--ok" : "badge--danger"}`}>
                      {m.isActive ? "active" : "suspended"}
                    </span>
                  </td>
                  <td>
                    {canToggle(m) && (
                      <button
                        type="button"
                        className={`btn btn--sm ${m.isActive ? "btn--danger" : ""}`}
                        onClick={() => setActive(m, !m.isActive)}
                      >
                        {m.isActive ? "Suspend" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && members.length === 0 && <div className="empty">No users yet.</div>}
      </div>
    </AppShell>
  );
}
