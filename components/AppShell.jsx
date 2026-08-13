"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { allowedNav } from "../lib/status";
import { api } from "../lib/api";

const ALL = ["owner", "coordinator", "contributor", "viewer"];
const MANAGERS = ["owner", "coordinator"];

const NAV = [
  { href: "/dashboard", label: "Portfolio", roles: ALL },
  { href: "/projects", label: "Projects", roles: ALL },
  { href: "/notifications", label: "Notifications", roles: ALL },
  { href: "/users", label: "Users", roles: MANAGERS },
  { href: "/templates", label: "Templates", roles: MANAGERS },
  { href: "/review", label: "Review queue", roles: MANAGERS },
  { href: "/settings", label: "Settings", roles: MANAGERS },
];

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const fetchUnread = () =>
      api
        .get("/notifications/unread-count")
        .then((res) => active && setUnread(res.data.data.unread))
        .catch(() => {});
    fetchUnread();
    const t = setInterval(fetchUnread, 60000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user, pathname]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 0" }}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div style={{ marginBottom: 28, padding: "0 8px" }}>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            MERL
          </div>
          <div style={{ fontSize: 12, color: "#8aa399", marginTop: 4 }}>
            {user.organization?.name || "Organization"}
          </div>
        </div>
        <nav>
          {allowedNav(NAV, user.role).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? "active" : ""}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>{item.label}</span>
              {item.href === "/notifications" && unread > 0 && (
                <span
                  style={{
                    background: "#e11d48",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "1px 7px",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 40, padding: "0 8px" }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "#8aa399", marginBottom: 12 }}>
            {user.role}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ color: "#fff", borderColor: "#345246" }}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
