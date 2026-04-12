import DashboardShell from "../../components/DashboardShell";

const resourceGroups = [
  {
    title: "Concept Refreshers",
    items: ["Python syntax guide", "Loop tracing worksheet", "Functions decision checklist"]
  },
  {
    title: "Practice Packs",
    items: ["10 beginner debugging prompts", "Conditionals challenge set", "Data structures mini-lab"]
  },
  {
    title: "Project Starters",
    items: ["CLI quiz app", "Student tracker", "Flask progress portal"]
  }
];

const supportSections = [
  {
    heading: "Study Rituals",
    body: "Build short, repeatable routines with a mix of review, active coding, and reflection."
  },
  {
    heading: "Instructor Notes",
    body: "Spot learners who are spending too long on easy concepts and intervene with targeted scaffolds."
  },
  {
    heading: "Feedback Prompts",
    body: "Ask learners what felt confusing, not just what they got wrong, to improve future recommendations."
  }
];

export default function ResourcesPage() {
  return (
    <main className="page-shell">
      <DashboardShell
        title="Resources Hub"
        subtitle="Curated support material for learners, instructors, and project-based progression."
      >
        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="eyebrow text-primary mb-2">Resources Hub</div>
          <h1 className="display-6 fw-bold mb-3">Curated material to support every stage of beginner growth.</h1>
          <p className="muted-copy mb-0">
            This page gives your frontend more product depth with a resource library, support guidance,
            and content that feels useful even before a learner signs in.
          </p>
        </div>

        <div className="row g-4 mb-4">
          {resourceGroups.map((group) => (
            <div className="col-lg-4" key={group.title}>
              <div className="metric-tile p-4 h-100">
                <h4 className="fw-bold">{group.title}</h4>
                <ul className="list-unstyled d-grid gap-3 mb-0 mt-3">
                  {group.items.map((item) => (
                    <li key={item} className="border-bottom pb-3">
                      <div className="fw-semibold">{item}</div>
                      <div className="small muted-copy">Recommended for active practice and review.</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-panel p-4 p-lg-5 mb-4">
          <div className="row g-4">
            {supportSections.map((section) => (
              <div className="col-md-4" key={section.heading}>
                <div className="glass-card rounded-4 p-4 h-100">
                  <div className="eyebrow mb-2">Support Layer</div>
                  <h4 className="fw-bold">{section.heading}</h4>
                  <p className="text-white-50 mb-0">{section.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card p-4 p-lg-5">
          <h2 className="fw-bold mb-3">Recommended content architecture for a larger frontend</h2>
          <div className="row g-3">
            <div className="col-md-3"><div className="metric-tile p-3 h-100">Learning paths</div></div>
            <div className="col-md-3"><div className="metric-tile p-3 h-100">Resource hub</div></div>
            <div className="col-md-3"><div className="metric-tile p-3 h-100">Instructor analytics</div></div>
            <div className="col-md-3"><div className="metric-tile p-3 h-100">Product story / about</div></div>
          </div>
        </div>
      </DashboardShell>
    </main>
  );
}
