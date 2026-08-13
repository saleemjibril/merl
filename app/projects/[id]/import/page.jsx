"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import { api } from "../../../../lib/api";

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i];
    });
    return row;
  });
}

export default function ImportPage() {
  const { id } = useParams();
  const [type, setType] = useState("indicators");
  const [periodId, setPeriodId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/projects/${id}/periods`).then((res) => {
      setPeriods(res.data.data.periods);
      if (res.data.data.periods[0]) setPeriodId(res.data.data.periods[0]._id);
    });
  }, [id]);

  async function runImport() {
    const rows = parseCsv(csv);
    if (!rows.length) {
      toast.error("Paste CSV with a header row");
      return;
    }
    try {
      const res = await api.post(`/projects/${id}/import`, {
        type,
        periodId: type === "indicators" ? undefined : periodId,
        rows,
      });
      setResult(res.data.data);
      toast.success("Import finished");
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    }
  }

  const samples = {
    indicators: "name,description,unit,direction,baselineValue,requiresEvidence\nFarmers trained,,number,increase,0,false",
    targets: "indicatorName,targetValue,notes\nFarmers trained,100,",
    actuals: "indicatorName,value,narrative\nFarmers trained,42,On track in Kaduna",
  };

  return (
    <AppShell>
      <h1 className="page-title">CSV import</h1>
      <p className="muted">Bulk-load indicators, targets, or actuals.</p>
      <ProjectNav projectId={id} />

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setCsv(samples[e.target.value]);
            }}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
          >
            <option value="indicators">Indicators</option>
            <option value="targets">Targets</option>
            <option value="actuals">Actuals</option>
          </select>
          {type !== "indicators" && (
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
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCsv(samples[type])}>
            Load sample
          </button>
        </div>
        <div className="field">
          <label>CSV</label>
          <textarea rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} />
        </div>
        <button type="button" className="btn" onClick={runImport}>
          Import
        </button>
        {result && (
          <p className="muted" style={{ marginTop: 12 }}>
            Created {result.created}, updated {result.updated}, errors {result.errors?.length || 0}
          </p>
        )}
      </div>
    </AppShell>
  );
}
