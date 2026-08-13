import { statusBadge } from "../lib/status";

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={statusBadge(status)}>{status.replace("_", " ")}</span>;
}
