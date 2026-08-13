"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "../../../../components/AppShell";
import ProjectNav from "../../../../components/ProjectNav";
import { api } from "../../../../lib/api";

export default function ReportsPage() {
  const { id } = useParams();
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [format, setFormat] = useState("pdf");
  const [reports, setReports] = useState([]);

  async function loadReports() {
    const res = await api.get(`/projects/${id}/reports`);
    setReports(res.data.data.reports);
  }

  useEffect(() => {
    api.get(`/projects/${id}/periods`).then((res) => {
      setPeriods(res.data.data.periods);
      if (res.data.data.periods[0]) setPeriodId(res.data.data.periods[0]._id);
    });
    loadReports().catch(() => {});
  }, [id]);

  async function generate() {
    try {
      await api.post(`/projects/${id}/reports`, { periodId, format });
      toast.success("Report generated");
      await loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  async function download(report) {
    try {
      const res = await api.get(`/projects/${id}/reports/${report._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = report.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Reports</h1>
      <p className="muted">Export donor-ready PDF, Excel, or CSV packs.</p>
      <ProjectNav projectId={id} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
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
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)" }}
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <button type="button" className="btn" onClick={generate} disabled={!periodId}>
            Generate report
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Format</th>
              <th>Generated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id}>
                <td>{r.fileName}</td>
                <td>{r.format}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => download(r)}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && <div className="empty">No reports yet.</div>}
      </div>
    </AppShell>
  );
}
