"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import API, { getCareerReadiness } from "../../lib/api";

const STATUS_LABELS = {
  complete: "Complete",
  "in-progress": "In progress",
  next: "Next",
  locked: "Locked"
};

export default function CareerDashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const planResponse = await API.get("/api/careers/me/plan");
        const data = planResponse.data;
        if (!data?.careerId) {
          router.push("/career-onboarding");
          return;
        }
        setPlan(data);
        const [resourceResponse, readinessResponse] = await Promise.all([
          API.get(`/api/resources/career/${data.careerId.slug}`),
          getCareerReadiness(),
        ]);
        setResources(resourceResponse.data || []);
        setReadiness(readinessResponse.data || null);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Could not load your career plan.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const progress = useMemo(() => {
    if (!plan?.skills?.length) return 0;
    return Math.round(plan.skills.reduce((sum, skill) => sum + Math.min(skill.currentLevel || 0, skill.targetLevel || 100), 0) / plan.skills.length);
  }, [plan]);

  const resourcesBySkill = useMemo(() => resources.reduce((groups, resource) => {
    if (!groups[resource.skillKey]) groups[resource.skillKey] = [];
    groups[resource.skillKey].push(resource);
    return groups;
  }, {}), [resources]);

  if (loading) return <main className="container py-5"><div className="section-card p-5">Loading your career roadmap…</div></main>;
  if (error) return <main className="container py-5"><div className="alert alert-danger">{error}</div></main>;

  return (
    <main className="page-shell">
      <div className="container py-4 py-lg-5">
        <div className="hero-panel p-4 p-lg-5 mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-8">
              <div className="eyebrow mb-2">Your Career Path</div>
              <h1 className="display-6 fw-bold mb-3">{plan.careerId.title}</h1>
              <p className="text-white-50 mb-4">{plan.careerId.description}</p>
              <div className="d-flex flex-wrap gap-2">
                <span className="feature-chip">{plan.targetRole || plan.careerId.targetRoles?.[0] || "Target role"}</span>
                <span className="feature-chip">{plan.hoursPerWeek} hrs/week</span>
                <span className="feature-chip">{plan.targetWeeks} weeks</span>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="glass-card rounded-4 p-4">
                <div className="small text-white-50">Job readiness</div>
                <div className="display-5 fw-bold mt-1">{readiness?.score ?? progress}%</div>
                <div className="fw-semibold mt-2">{readiness?.label || "Building readiness"}</div>
                <div className="progress mt-3" style={{ height: 8 }}>
                  <div className="progress-bar" style={{ width: `${readiness?.score ?? progress}%` }} />
                </div>
                <div className="small text-white-50 mt-2">Skill mastery + Practice evidence + Prove evidence.</div>
              </div>
            </div>
          </div>
        </div>

        {readiness ? (
          <div className="row g-4 mb-4">
            <div className="col-md-4"><div className="section-card p-4 h-100"><div className="small text-muted">Core skill proof</div><div className="display-6 fw-bold mt-1">{readiness.provenCoreSkillCount}/{readiness.coreSkillCount}</div><div className="small muted-copy mt-1">Core skills with portfolio evidence.</div></div></div>
            <div className="col-md-4"><div className="section-card p-4 h-100"><div className="small text-muted">Practice coverage</div><div className="display-6 fw-bold mt-1">{readiness.practiceCoverage}%</div><div className="small muted-copy mt-1">Skills backed by qualifying practice.</div></div></div>
            <div className="col-md-4"><div className="section-card p-4 h-100"><div className="small text-muted">Portfolio score</div><div className="display-6 fw-bold mt-1">{readiness.portfolioScore}%</div><div className="small muted-copy mt-1">Coverage across core career skills.</div></div></div>
          </div>
        ) : null}

        {readiness?.nextActions?.length ? (
          <div className="section-card p-4 p-lg-5 mb-4">
            <div className="eyebrow text-primary mb-2">What to do next</div>
            <h2 className="fw-bold mb-3">Your highest-impact moves</h2>
            <div className="row g-3">
              {readiness.nextActions.map((action, index) => (
                <div className="col-lg-4" key={action.skillKey}>
                  <div className="metric-tile p-3 h-100"><div className="small text-muted">#{index + 1}</div><div className="fw-bold mt-1">{action.title}</div><div className="small muted-copy mt-2">{action.action}</div></div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
            <div>
              <div className="eyebrow text-primary mb-2">Personalized roadmap</div>
              <h2 className="fw-bold mb-1">Your skills, in the order they matter</h2>
              <p className="muted-copy mb-0">Each skill gets a focused set of free resources and measurable evidence milestones.</p>
            </div>
            <button type="button" className="btn btn-outline-dark" onClick={() => router.push("/career-onboarding")}>Rebuild plan</button>
          </div>

          <div className="d-grid gap-3">
            {plan.skills.map((skill, index) => {
              const percentage = Math.min(100, Math.round((skill.currentLevel / Math.max(skill.targetLevel, 1)) * 100));
              const careerSkill = plan.careerId.skills?.find((item) => item.key === skill.skillKey);
              const skillResources = resourcesBySkill[skill.skillKey] || [];
              const readinessSkill = readiness?.skills?.find((item) => item.skillKey === skill.skillKey);
              return (
                <div className="metric-tile p-4" key={skill.skillKey}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="d-flex gap-3">
                      <div className="rounded-circle border d-flex align-items-center justify-content-center fw-bold" style={{ width: 42, height: 42 }}>{index + 1}</div>
                      <div>
                        <div className="fw-bold fs-5 text-capitalize">{careerSkill?.title || skill.skillKey.replaceAll("-", " ")}</div>
                        <div className="small muted-copy mt-1">Target mastery: {skill.targetLevel}% · {readinessSkill?.proof ? "Proof submitted" : "Proof needed"}</div>
                      </div>
                    </div>
                    <span className={`badge ${skill.status === "complete" ? "text-bg-success" : skill.status === "locked" ? "text-bg-secondary" : "text-bg-primary"}`}>{STATUS_LABELS[skill.status] || skill.status}</span>
                  </div>

                  <div className="mt-3">
                    <div className="d-flex justify-content-between small mb-1"><span>{skill.currentLevel}% current</span><span>{percentage}% of target</span></div>
                    <div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${percentage}%` }} /></div>
                  </div>

                  {skillResources.length > 0 ? (
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-2"><div className="fw-semibold">Best free resources</div><span className="small muted-copy">{skillResources.length} curated</span></div>
                      <div className="row g-2">
                        {skillResources.map((resource) => (
                          <div className="col-lg-6" key={`${skill.skillKey}-${resource.rank}-${resource.url}`}>
                            <a className="d-block text-decoration-none h-100" href={resource.url} target="_blank" rel="noreferrer">
                              <div className="border rounded-4 p-3 h-100 bg-white">
                                <div className="d-flex justify-content-between gap-2"><div className="fw-semibold text-dark">{resource.title}</div>{resource.rank === 1 ? <span className="badge text-bg-success">Top pick</span> : null}</div>
                                <div className="small text-muted mt-1">{resource.provider} • {resource.type} • Free</div>
                                {resource.estimatedHours ? <div className="small text-muted mt-1">~{resource.estimatedHours} hours</div> : null}
                                <div className="small text-dark mt-2">{resource.reason}</div>
                                <div className="small fw-semibold text-primary mt-2">Open resource ↗</div>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="small muted-copy mt-4">Resource curation for this skill is coming next.</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Career execution</div>
              <h3 className="fw-bold mb-3">Close the loop on every skill</h3>
              <div className="d-grid gap-3">
                <div className="metric-tile p-3"><strong>Learn</strong><div className="small muted-copy mt-1">Start with the top free resource or existing lessons.</div></div>
                <div className="metric-tile p-3"><strong>Practice</strong><div className="small muted-copy mt-1">Qualifying quizzes and coding exercises now become career evidence automatically.</div></div>
                <div className="metric-tile p-3"><strong>Prove</strong><div className="small muted-copy mt-1">Submit a real project, repository, or demo and turn the skill into portfolio evidence.</div></div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Next move</div>
              <h3 className="fw-bold mb-3">Open your execution journey</h3>
              <p className="muted-copy">Use the Career Journey to complete Learn, build Practice evidence, and submit Prove artifacts.</p>
              <button type="button" className="btn btn-primary" onClick={() => router.push("/career-journey")}>Open Career Journey</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
