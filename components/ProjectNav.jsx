"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { allowedNav } from "../lib/status";

const ALL = ["owner", "coordinator", "contributor", "viewer"];
const MANAGERS = ["owner", "coordinator"];

const LINKS = [
  { slug: "", label: "Dashboard", roles: ALL },
  { slug: "framework", label: "Logframe", roles: MANAGERS },
  { slug: "indicators", label: "Indicators", roles: MANAGERS },
  { slug: "periods", label: "Periods", roles: MANAGERS },
  { slug: "targets", label: "Targets", roles: MANAGERS },
  { slug: "data-entry", label: "Data entry", roles: ["owner", "coordinator", "contributor"] },
  { slug: "reports", label: "Reports", roles: ["owner", "coordinator", "viewer"] },
  { slug: "share", label: "Share", roles: MANAGERS },
  { slug: "import", label: "Import", roles: MANAGERS },
  { slug: "settings", label: "Settings", roles: MANAGERS },
];

export default function ProjectNav({ projectId }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const base = `/projects/${projectId}`;
  const links = allowedNav(LINKS, user?.role);

  return (
    <div
      className="row"
      style={{
        margin: "16px 0 24px",
        gap: 6,
        borderBottom: "1px solid var(--line)",
        paddingBottom: 10,
      }}
    >
      {links.map((l) => {
        const href = l.slug ? `${base}/${l.slug}` : base;
        const active =
          l.slug === ""
            ? pathname === base
            : pathname.startsWith(`${base}/${l.slug}`);
        return (
          <Link
            key={l.label}
            href={href}
            className={`btn btn--sm ${active ? "" : "btn--ghost"}`}
            style={active ? {} : { background: "transparent" }}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
