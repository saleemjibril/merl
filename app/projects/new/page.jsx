"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../components/AppShell";
import LocationFields from "../../../components/LocationFields";
import DateField from "../../../components/DateField";
import { api } from "../../../lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sector: "other",
    state: "",
    lga: "",
    startDate: "",
    endDate: "",
    templateKey: "",
  });

  useEffect(() => {
    api.get("/templates").then((res) => setTemplates(res.data.data.templates));
  }, []);

  function set(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "templateKey" && value) {
        const t = templates.find((x) => x.key === value);
        if (t) next.sector = t.sector;
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        templateKey: form.templateKey || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      const { data } = await api.post("/projects", payload);
      toast.success("Project created");
      router.push(`/projects/${data.data.project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">New project</h1>
      <p className="muted">Optionally start from a sector template with a full logframe.</p>
      <form className="card" style={{ marginTop: 20, maxWidth: 640 }} onSubmit={onSubmit}>
        <div className="field">
          <label>Project name</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Start from template</label>
          <select value={form.templateKey} onChange={(e) => set("templateKey", e.target.value)}>
            <option value="">Blank framework</option>
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Sector</label>
          <select value={form.sector} onChange={(e) => set("sector", e.target.value)}>
            <option value="agriculture">Agriculture</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        <LocationFields
          state={form.state}
          lga={form.lga}
          onChange={({ state, lga }) => setForm((f) => ({ ...f, state, lga }))}
        />
        <div className="grid grid-2">
          <DateField
            label="Start date"
            value={form.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <DateField
            label="End date"
            value={form.endDate}
            onChange={(v) => set("endDate", v)}
          />
        </div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create project"}
        </button>
      </form>
    </AppShell>
  );
}
