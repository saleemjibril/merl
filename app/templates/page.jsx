"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export default function TemplatesPage() {
  const { user, loading } = useAuth();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    api
      .get("/templates")
      .then((res) => setTemplates(res.data.data.templates))
      .catch((err) => toast.error(err.response?.data?.message || "Failed"));
  }, []);

  const body = (
    <>
      <h1 className="page-title">Sector templates</h1>
      <p className="muted">
        Starter logframes with outcomes, outputs, activities, and indicators.
      </p>
      <div className="grid grid-auto" style={{ marginTop: 20 }}>
        {templates.map((t) => (
          <div key={t.key} className="card">
            <span className="badge badge--muted">{t.sector}</span>
            <h3 style={{ marginTop: 10, fontSize: 20 }}>{t.name}</h3>
            <p className="muted">{t.description}</p>
            <p className="muted" style={{ fontSize: 13 }}>
              {(t.blueprint?.nodes || []).length} nodes ·{" "}
              {(t.blueprint?.indicators || []).length} indicators
            </p>
            {user ? (
              <Link
                href={`/projects/new`}
                className="btn btn--sm"
                style={{ marginTop: 12 }}
              >
                Use in new project
              </Link>
            ) : (
              <Link href="/signup" className="btn btn--sm" style={{ marginTop: 12 }}>
                Sign up to use
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (loading) return <p className="muted container" style={{ padding: 40 }}>Loading…</p>;
  if (user) return <AppShell>{body}</AppShell>;
  return (
    <div className="hero-landing" style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container">{body}</div>
    </div>
  );
}
