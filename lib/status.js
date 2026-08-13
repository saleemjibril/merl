export function statusBadge(status) {
  switch (status) {
    case "achieved":
    case "on_track":
    case "approved":
      return "badge badge--ok";
    case "at_risk":
    case "today":
    case "submitted":
      return "badge badge--warn";
    case "off_track":
    case "overdue":
    case "rejected":
    case "missing":
      return "badge badge--danger";
    default:
      return "badge badge--muted";
  }
}

export function formatCountdown(cd) {
  if (!cd) return null;
  if (cd.kind === "remaining") {
    return cd.days === 1 ? "1 day left" : `${cd.days} days left`;
  }
  if (cd.kind === "today") return "Due today";
  return cd.days === 1 ? "1 day overdue" : `${cd.days} days overdue`;
}

export function canEdit(role) {
  return ["owner", "coordinator", "contributor"].includes(role);
}

export function canCoordinate(role) {
  return ["owner", "coordinator"].includes(role);
}

/** Contributors are data-entry only; use this to hide management features. */
export function isContributorOnly(role) {
  return role === "contributor";
}

/** Filter a list of nav items ({ roles: [...] }) by the current role. */
export function allowedNav(items, role) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
