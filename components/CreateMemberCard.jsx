"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PasswordField from "./PasswordField";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const EMPTY_MEMBER = { name: "", email: "", password: "", role: "contributor" };

export default function CreateMemberCard() {
  const { user } = useAuth();
  const canManage = ["owner", "coordinator"].includes(user?.role);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const res = await api.get("/org");
      setMembers(res.data.data.members || []);
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

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

  if (!canManage) return null;

  return (
    <div className="card" style={{ marginTop: 20, maxWidth: 640 }}>
      <h3 style={{ fontSize: 18 }}>Team members</h3>
      <p className="muted" style={{ marginBottom: 12 }}>
        Create an account so a team member can log in and submit data entries.
        Share the email and password with them.
      </p>

      {members.length > 0 && (
        <table className="table" style={{ marginBottom: 16 }}>
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
      )}

      <form onSubmit={createMember}>
        <div className="grid grid-2">
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              required
              placeholder="Jane Doe"
              value={newMember.name}
              onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="jane@org.org"
              value={newMember.email}
              onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))}
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
            onChange={(e) => setNewMember((m) => ({ ...m, password: e.target.value }))}
          />
          <div className="field">
            <label>Role</label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}
            >
              <option value="contributor">Contributor — enters data</option>
              <option value="coordinator">Coordinator — enters &amp; reviews</option>
              <option value="viewer">Viewer — read only</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
