import DashboardShell from "../../components/DashboardShell";

export default function AboutPage() {
  return (
    <main className="page-shell">
      <DashboardShell
        title="About PathPilot AI"
        subtitle="See the startup story, architecture layers, and the product logic behind the recommendation system."
      >
        <div className="hero-panel-alt p-4 p-lg-5 mb-4">
          <div className="eyebrow mb-3">About The Platform</div>
          <h1 className="display-5 fw-bold mb-3">An edtech startup built to reduce beginner frustration.</h1>
          <p className="text-white-50 fs-5 mb-0">
            The platform&apos;s purpose is simple: detect where novice programmers struggle early, then
            respond with focused guidance instead of generic content dumps.
          </p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Mission</div>
              <h3 className="fw-bold">More confidence, less confusion</h3>
              <p className="muted-copy mb-0">
                We use learner signals to recommend the next best action instead of expecting
                beginners to self-diagnose every gap.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Market</div>
              <h3 className="fw-bold">Students, mentors, and institutions</h3>
              <p className="muted-copy mb-0">
                Students get guidance and momentum. Instructors get visibility into weak topics,
                risk levels, and where coaching matters most across a cohort.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Product Edge</div>
              <h3 className="fw-bold">Rules plus machine learning</h3>
              <p className="muted-copy mb-0">
                Recommendations come from a hybrid engine that balances pedagogical order with predicted mastery gaps.
              </p>
            </div>
          </div>
        </div>

        <div className="section-card p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-3">System layers</h2>
              <div className="page-divider my-3" />
              <div className="d-grid gap-3">
                <div><strong>Data ingestion:</strong> quiz scores, coding submissions, time spent, attempts, and feedback.</div>
                <div><strong>Analysis:</strong> trend analysis, weak-topic detection, and progress snapshots.</div>
                <div><strong>Recommendation engine:</strong> next topics, exercises, resources, and mastery-gap scoring.</div>
                <div><strong>Presentation:</strong> student dashboard, instructor analytics, and API docs.</div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="metric-tile p-4">
                <div className="small muted-copy mb-2">Tech stack</div>
                <div className="d-grid gap-2">
                  <div className="soft-chip">Express API backend</div>
                  <div className="soft-chip">MongoDB storage</div>
                  <div className="soft-chip">Recommendation analytics layer</div>
                  <div className="soft-chip">Next.js premium frontend</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </main>
  );
}
