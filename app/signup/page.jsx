"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import { signup } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import PasswordField from "../../components/PasswordField";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite") || "";
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await signup({ ...form, inviteToken: invite || undefined });
      setUser(data.data.user);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h1 className="page-title" style={{ fontSize: 28 }}>
        {invite ? "Accept invite" : "Start free trial"}
      </h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        14 days to set up a project, logframe, and first period report.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Your name</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Work email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        {!invite && (
          <div className="field">
            <label>Organization name</label>
            <input
              required
              value={form.organizationName}
              onChange={(e) => set("organizationName", e.target.value)}
            />
          </div>
        )}
        <PasswordField
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required
          autoComplete="new-password"
        />
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="hero-landing" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 440, padding: "80px 0" }}>
        <Link href="/" style={{ fontFamily: "var(--font)", fontSize: 28, fontWeight: 700 }}>
          MERL
        </Link>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
