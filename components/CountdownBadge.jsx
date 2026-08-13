import { formatCountdown, statusBadge } from "../lib/status";

export default function CountdownBadge({ countdown }) {
  if (!countdown) return null;
  const text = formatCountdown(countdown);
  const cls =
    countdown.kind === "overdue"
      ? statusBadge("overdue")
      : countdown.kind === "today" || countdown.days <= 14
        ? statusBadge("at_risk")
        : statusBadge("on_track");
  return <span className={cls}>{text}</span>;
}
