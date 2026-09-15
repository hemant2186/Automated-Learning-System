"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../lib/api";

const STATUS_LABELS = {
  complete: "Complete",
  "in-progress": "In progress",
  next: "Next",
  locked: "Locked"
};

export default function CareerDashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/api/careers/me/plan")
      .then((response) => {
        const data = response.data;
        if (!data?.careerId) {
          router.push("/career-onboarding");
          return;
        }
        setPlan(data);
      })
      .catch(() => setError("Could not load your career plan."))
      .finally(() => setLoading(false));
  }, [router]);

  const progress = useMemo(() => {
    if (!plan?.skills?.length) return 0;
    return Math.round(plan.skills.reduce((sum, skill) => sum + Math.min(skill.currentLevel || 0, skill.targetLevel || 100), 0) / plan.skills.length);
  }, [plan]);

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
                <div className="small text-white-50">Career readiness journey</div>
                <div className="display-5 fw-bold mt-1">{progress}%</div>
                <div className="progress mt-3" style={{ height: 8 }}>
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="small text-white-50 mt-2">Based on your current skill levels and targets.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
            <div>
              <div className="eyebrow text-primary mb-2">Personalized roadmap</div>
              <h2 className="fw-bold mb-1">Your skills, in the order they matter</h2>
              <p className="muted-copy mb-0">Locked skills open as their prerequisites become ready.</p>
            </div>
            <button type="button" className="btn btn-outline-dark" onClick={() => router.push("/career-onboarding")}>Rebuild plan</button>
          </div>

          <div className="d-grid gap-3">
            {plan.skills.map((skill, index) => {
              const percentage = Math.min(100, Math.round((skill.currentLevel / Math.max(skill.targetLevel, 1)) * 100));
              const careerSkill = plan.careerId.skills?.find((item) => item.key === skill.skillKey);
              const resources = careerSkill?.resources || [];
              return (
                <div className="metric-tile p-4" key={skill.skillKey}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="d-flex gap-3">
                      <div className="rounded-circle border d-flex align-items-center justify-content-center fw-bold" style={{ width: 42, height: 42 }}>{index + 1}</div>
                      <div>
                        <div className="fw-bold fs-5 text-capitalize">{careerSkill?.title || skill.skillKey.replaceAll("-", " ")}</div>
                        <div className="small muted-copy mt-1">Target mastery: {skill.targetLevel}%</div>
                      </div>
                    </div>
                    <span className={`badge ${skill.status === "complete" ? "text-bg-success" : skill.status === "locked" ? "text-bg-secondary" : "text-bg-primary"}`}>{STATUS_LABELS[skill.status] || skill.status}</span>
                  </div>

                  <div className="mt-3">
                    <div className="d-flex justify-content-between small mb-1"><span>{skill.currentLevel}% current</span><span>{percentage}% of target</span></div>
                    <div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${percentage}%` }} /></div>
                  </div>

                  {resources.length > 0 ? (
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">Recommended free resources</div>
                        <span className="small muted-copy">{resources.length} resource{resources.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="row g-2">
                        {resources.map((resource) => (
                          <div className="col-lg-6" key={`${skill.skillKey}-${resource.url}`}>
                            <a className="d-block text-decoration-none h-100" href={resource.url} target="_blank" rel="noreferrer">
                              <div className="border rounded-4 p-3 h-100 bg-white">
                                <div className="d-flex justify-content-between gap-2">
                                  <div className="fw-semibold text-dark">{resource.title}</div>
                                  {resource.preferred ? <span className="badge text-bg-success">Recommended</span> : null}
                                </div>
                                <div className="small text-muted mt-1">{resource.provider} • {resource.type} • Free</div>
                                {resource.estimatedHours ? <div className="small text-muted mt-1">~{resource.estimatedHours} hours</div> : null}
                                <div className="small text-dark mt-2">{resource.whyRecommended}</div>
                                <div className="small fw-semibold text-primary mt-2">Open resource ↗</div>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Career strategy</div>
              <h3 className="fw-bold mb-3">How this roadmap works</h3>
              <div className="d-grid gap-3">
                <div className="metric-tile p-3"><strong>Learn</strong><div className="small muted-copy mt-1">Start with the preferred free resource or the existing lessons mapped to this skill.</div></div>
                <div className="metric-tile p-3"><strong>Practice</strong><div className="small muted-copy mt-1">Use quizzes, coding exercises, notebooks, sheets, and projects to turn study time into measurable signals.</div></div>
                <div className="metric-tile p-3"><strong>Prove</strong><div className="small muted-copy mt-1">Projects and assessments will eventually raise the skill from “studied” to “demonstrated”.</div></div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Next move</div>
              <h3 className="fw-bold mb-3">Continue your existing learning engine</h3>
              <p className="muted-copy">Your career plan is the new layer. Your existing lessons, quizzes, projects, activity tracking, and recommendations remain the learning engine underneath it.</p>
              <button type="button" className="btn btn-primary" onClick={() => router.push("/learning-paths")}>Browse learning paths</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
