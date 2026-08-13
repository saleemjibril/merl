"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import CountdownBadge from "../../../components/CountdownBadge";
import StatusBadge from "../../../components/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export default function PublicSharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/share/${token}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Link unavailable"));
  }, [token]);

  if (error) {
    return (
      <div className="container" style={{ padding: "80px 0" }}>
        <h1 className="page-title">Unavailable</h1>
        <p className="muted">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: "80px 0" }}>
        <p className="muted">Loading shared dashboard…</p>
      </div>
    );
  }

  return (
    <div className="hero-landing" style={{ minHeight: "100vh", padding: "40px 0 80px" }}>
      <div className="container">
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          MERL
        </div>
        <p className="muted">{data.label}</p>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          {data.project.name}
        </h1>
        <p className="muted">{data.project.description}</p>
        {data.period && (
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge badge--muted">{data.period.name}</span>
            <CountdownBadge countdown={data.period.countdown} />
          </div>
        )}
        <div className="grid grid-auto" style={{ marginTop: 28 }}>
          {data.cards.map((c, i) => (
            <div key={i} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <StatusBadge status={c.progress?.status} />
              </div>
              <h3 style={{ fontSize: 17, marginTop: 8 }}>{c.name}</h3>
              <div className="metric-value" style={{ marginTop: 10 }}>
                {c.actual == null ? "—" : Number(c.actual).toLocaleString()}
                {c.target != null && (
                  <span style={{ fontSize: 16, color: "var(--ink-muted)" }}>
                    {" "}
                    / {Number(c.target).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {c.progress?.percent != null ? `${c.progress.percent}%` : "No target"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
