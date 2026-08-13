"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import LocationFields from "../../../../components/LocationFields";
import DateField from "../../../../components/DateField";
import CreateMemberCard from "../../../../components/CreateMemberCard";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { canCoordinate } from "../../../../lib/status";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canCoordinate(user?.role);
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`/projects/${id}`).then((res) => {
      const p = res.data.data.project;
      setForm({
        name: p.name,
        description: p.description || "",
        sector: p.sector,
        state: p.state || "",
        lga: p.lga || "",
        startDate: p.startDate ? p.startDate.slice(0, 10) : "",
        endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      });
    });
  }, [id]);

  async function save(e) {
    e.preventDefault();
    try {
      await api.patch(`/projects/${id}`, form);
      toast.success("Saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function archive() {
    if (!confirm("Archive this project?")) return;
    await api.delete(`/projects/${id}`);
    toast.success("Archived");
    router.push("/dashboard");
  }

  if (!form) {
    return (
      <AppShell>
        <p className="muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="page-title">Project settings</h1>
      <ProjectNav projectId={id} />
      <form className="card" onSubmit={save} style={{ maxWidth: 640 }}>
        <div className="field">
          <label>Name</label>
          <input
            disabled={!canEdit}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            disabled={!canEdit}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Sector</label>
          <select
            disabled={!canEdit}
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          >
            <option value="agriculture">Agriculture</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        <LocationFields
          state={form.state}
          lga={form.lga}
          disabled={!canEdit}
          onChange={({ state, lga }) => setForm((f) => ({ ...f, state, lga }))}
        />
        <div className="grid grid-2">
          <DateField
            label="Start date"
            value={form.startDate}
            onChange={(v) => setForm({ ...form, startDate: v })}
          />
          <DateField
            label="End date"
            value={form.endDate}
            onChange={(v) => setForm({ ...form, endDate: v })}
          />
        </div>
        {canEdit && (
          <div className="row">
            <button className="btn" type="submit">
              Save
            </button>
            {user?.role === "owner" && (
              <button type="button" className="btn btn--danger" onClick={archive}>
                Archive project
              </button>
            )}
          </div>
        )}
      </form>

      <CreateMemberCard />
    </AppShell>
  );
}
