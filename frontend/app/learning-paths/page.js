import Link from "next/link";
import DashboardShell from "../../components/DashboardShell";

const paths = [
  {
    title: "Zero to Python",
    phase: "Weeks 1-4",
    description: "Master syntax, variables, loops, and functions with short wins and low-friction exercises.",
    milestones: ["Daily warm-up quizzes", "Function-first mini tasks", "Confidence checkpoints"]
  },
  {
    title: "Logic and Debugging Lab",
    phase: "Weeks 5-8",
    description: "Move from writing code to understanding why code works, breaks, and improves over time.",
    milestones: ["Bug diagnosis drills", "Trace-table practice", "Algorithm thinking sessions"]
  },
  {
    title: "Build and Launch",
    phase: "Weeks 9-12",
    description: "Translate emerging skills into simple projects using databases, APIs, and web interfaces.",
    milestones: ["Portfolio project map", "Database readiness", "Flask deployment checklist"]
  }
];

export default function LearningPathsPage() {
  return (
    <main className="page-shell">
      <DashboardShell
        title="Learning Path Library"
        subtitle="Explore structured journeys that turn beginner uncertainty into steady momentum."
        actions={
          <Link href="/dashboard" className="btn btn-primary">
            Open live dashboard
          </Link>
        }
      >
        <div className="hero-panel-alt p-4 p-lg-5 mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-8">
              <div className="eyebrow mb-3">Learning Path Library</div>
              <h1 className="display-5 fw-bold mb-3">Structured journeys that feel supportive, not overwhelming.</h1>
              <p className="text-white-50 fs-5 mb-0">
                Each path is designed for novice programmers who need clarity, confidence, and visible progress.
              </p>
            </div>
            <div className="col-lg-4">
              <div className="glass-card rounded-4 p-4">
                <div className="small text-white-50">Recommended next step</div>
                <div className="h3 fw-bold">Match a path to your current mastery level</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          {paths.map((path) => (
            <div className="col-lg-4" key={path.title}>
              <div className="section-card p-4 h-100">
                <div className="soft-chip mb-3">{path.phase}</div>
                <h3 className="fw-bold">{path.title}</h3>
                <p className="muted-copy">{path.description}</p>
                <ul className="list-unstyled d-grid gap-2 mb-0">
                  {path.milestones.map((milestone) => (
                    <li key={milestone} className="d-flex gap-2">
                      <span className="accent-dot mt-2" style={{ background: "var(--accent-3)" }} />
                      <span>{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="section-card p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <h2 className="fw-bold">How path personalization works</h2>
              <p className="muted-copy">
                The system blends observed quiz performance, coding results, time spent, repeated attempts,
                and instructor feedback into topic mastery scores. Those scores feed both sequencing rules and
                machine learning predictions to recommend the next best topic.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="metric-tile p-4">
                <div className="d-grid gap-3">
                  <div>
                    <div className="small muted-copy">Signal 1</div>
                    <div className="fw-semibold">Learning behavior ingestion</div>
                  </div>
                  <div>
                    <div className="small muted-copy">Signal 2</div>
                    <div className="fw-semibold">Gap analysis and weak-topic detection</div>
                  </div>
                  <div>
                    <div className="small muted-copy">Signal 3</div>
                    <div className="fw-semibold">Adaptive path and resource recommendations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard" className="btn btn-primary">
              Open live dashboard
            </Link>
          </div>
        </div>
      </DashboardShell>
    </main>
  );
}
