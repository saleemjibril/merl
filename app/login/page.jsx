"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import PasswordField from "../../components/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await login(email, password);
      setUser(data.data.user);
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero-landing" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 440, padding: "80px 0" }}>
        <Link href="/" style={{ fontFamily: "var(--font)", fontSize: 28, fontWeight: 700 }}>
          MERL
        </Link>
        <div className="card" style={{ marginTop: 24 }}>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            Log in
          </h1>
          <p className="muted" style={{ marginBottom: 18 }}>
            Access your organization&apos;s projects.
          </p>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16 }}>
            No account? <Link href="/signup">Start a free trial</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
