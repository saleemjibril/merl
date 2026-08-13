"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import PasswordField from "../../components/PasswordField";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

const EMPTY_MEMBER = { name: "", email: "", password: "", role: "contributor" };

export default function SettingsPage() {
  const { user } = useAuth();
  const canManage = ["owner", "coordinator"].includes(user?.role);
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("contributor");
  const [inviteUrl, setInviteUrl] = useState("");
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await api.get("/org");
    setOrg(res.data.data.organization);
    setMembers(res.data.data.members);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, []);

  async function invite(e) {
    e.preventDefault();
    try {
      const res = await api.post("/org/invites", {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteUrl(res.data.data.inviteUrl);
      toast.success("Invite created");
      setInviteEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function createMember(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/org/members", newMember);
      toast.success(`Account created for ${newMember.name}`);
      setNewMember(EMPTY_MEMBER);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Settings</h1>
      <p className="muted">Organization and team.</p>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 18 }}>Organization</h3>
        <p>
          <strong>{org?.name}</strong>
        </p>
        <p className="muted">No project or user caps for now.</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18 }}>Team</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m._id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {canManage && (
          <form onSubmit={invite} className="row" style={{ marginTop: 12 }}>
            <input
              type="email"
              required
              placeholder="email@org.org"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
            >
              <option value="coordinator">Coordinator</option>
              <option value="contributor">Contributor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="btn" type="submit">
              Invite
            </button>
          </form>
        )}
        {inviteUrl && (
          <p className="muted" style={{ marginTop: 10, wordBreak: "break-all" }}>
            Invite URL: {inviteUrl}
          </p>
        )}
      </div>

      {canManage && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 18 }}>Create member account</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Set up an account directly so a team member can log in and submit data
            entries. Share the email and password with them.
          </p>
          <form onSubmit={createMember}>
            <div className="grid grid-2">
              <div className="field">
                <label>Full name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember((m) => ({ ...m, name: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@org.org"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember((m) => ({ ...m, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-2">
              <PasswordField
                id="new-member-password"
                label="Temporary password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newMember.password}
                onChange={(e) =>
                  setNewMember((m) => ({ ...m, password: e.target.value }))
                }
              />
              <div className="field">
                <label>Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember((m) => ({ ...m, role: e.target.value }))
                  }
                >
                  <option value="contributor">Contributor — enters data</option>
                  <option value="coordinator">Coordinator — enters & reviews</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
              </div>
            </div>
            <button className="btn" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
