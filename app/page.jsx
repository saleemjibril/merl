import Link from "next/link";

export const metadata = {
  title: "MERL — Monitor & evaluate projects",
};

export default function LandingPage() {
  return (
    <div className="hero-landing">
      <header
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          MERL
        </div>
        <div className="row">
          <Link href="/login" className="btn btn--ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn">
            Start free trial
          </Link>
        </div>
      </header>

      <section
        className="container"
        style={{
          padding: "72px 0 100px",
          maxWidth: 720,
        }}
      >
        <p
          className="muted"
          style={{
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          Monitoring & evaluation for project coordinators
        </p>
        <h1
          className="page-title"
          style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginBottom: 16 }}
        >
          Track indicators, evidence, and report deadlines — without the spreadsheet panic.
        </h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 560, marginBottom: 28 }}>
          Build a results framework, set period targets, enter actuals, attach evidence,
          and export donor-ready reports from one place.
        </p>
        <div className="row">
          <Link href="/signup" className="btn">
            Create your organization
          </Link>
          <Link href="/templates" className="btn btn--ghost">
            Browse sector templates
          </Link>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="grid grid-3">
          {[
            {
              t: "Full logframe tree",
              d: "Goal → outcomes → outputs → activities, with indicators attached to each node.",
            },
            {
              t: "Current vs target",
              d: "Period dashboards with countdown badges, progress status, and drill-down entry.",
            },
            {
              t: "Evidence & reports",
              d: "Approve submissions, attach proof, share a donor link, export PDF or Excel.",
            },
          ].map((item) => (
            <div key={item.t} className="card">
              <h3 style={{ fontSize: 20 }}>{item.t}</h3>
              <p className="muted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
