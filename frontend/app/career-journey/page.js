"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { completeCareerStage, getCareerJourney, submitCareerProof } from "../../lib/api";
import API from "../../lib/api";

const STAGES = [
  { key: "learn", label: "Learn" },
  { key: "practice", label: "Practice" },
  { key: "prove", label: "Prove" },
];

export default function CareerJourneyPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [resources, setResources] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [proof, setProof] = useState({ skillKey: "", title: "", summary: "", repositoryUrl: "", demoUrl: "" });

  const load = async () => {
    try {
      const journeyResponse = await getCareerJourney();
      const result = journeyResponse.data;
      if (!result?.plan) {
        router.push("/career-onboarding");
        return;
      }
      setData(result);
      const slug = result.plan.careerId?.slug;
      if (slug) {
        const resourceResponse = await API.get(`/api/careers/${slug}/resources`);
        setResources(resourceResponse.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not load your learning journey.");
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const resourceBySkill = useMemo(() => resources.reduce((map, item) => {
    if (!map[item.skillKey]) map[item.skillKey] = [];
    map[item.skillKey].push(item);
    return map;
  }, {}), [resources]);

  const markComplete = async (skillKey, stage) => {
    setBusy(`${skillKey}:${stage}`);
    setError("");
    try {
      await completeCareerStage(skillKey, stage);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this stage.");
    } finally {
      setBusy("");
    }
  };

  const submitProof = async (event, skillKey) => {
    event.preventDefault();
    setBusy(`proof:${skillKey}`);
    setError("");
    try {
      await submitCareerProof({ ...proof, skillKey });
      setProof({ skillKey: "", title: "", summary: "", repositoryUrl: "", demoUrl: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not submit proof.");
    } finally {
      setBusy("");
    }
  };

  if (error && !data) return <main className="container py-5"><div className="alert alert-danger">{error}</div></main>;
  if (!data) return <main className="container py-5"><div className="section-card p-5">Loading your Learn → Practice → Prove journey…</div></main>;

  return (
    <main className="page-shell">
      <div className="container py-4 py-lg-5">
        <div className="hero-panel p-4 p-lg-5 mb-4">
          <div className="eyebrow mb-2">Skill execution plan</div>
          <h1 className="display-6 fw-bold mb-2">{data.plan.targetRole || data.plan.careerId?.title || "Career path"}</h1>
          <p className="text-white-50 mb-0">For every skill, complete the loop: Learn → Practice → Prove.</p>
        </div>

        {error ? <div className="alert alert-warning">{error}</div> : null}

        <div className="d-grid gap-4">
          {data.journey.skills.map((skill, index) => {
            const planSkill = data.plan.skills.find((item) => item.skillKey === skill.skillKey);
            const skillResources = resourceBySkill[skill.skillKey] || [];
            return (
              <section className="section-card p-4" key={skill.skillKey}>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <div className="small text-muted">Skill {index + 1}</div>
                    <h2 className="h4 fw-bold mb-1 text-capitalize">{skill.skillKey.replaceAll("-", " ")}</h2>
                    <div className="small muted-copy">Current mastery: {planSkill?.currentLevel || 0}% · Target: {planSkill?.targetLevel || 75}%</div>
                  </div>
                  <span className="badge text-bg-primary">{planSkill?.status || "next"}</span>
                </div>

                <div className="row g-3">
                  {STAGES.map((stage, stageIndex) => {
                    const current = skill[stage.key];
                    const previous = stageIndex > 0 ? skill[STAGES[stageIndex - 1].key] : null;
                    const canAct = current.status === "available" || current.status === "in-progress" || stageIndex === 0;
                    return (
                      <div className="col-md-4" key={stage.key}>
                        <div className="metric-tile p-3 h-100">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{stage.label}</strong>
                            <span className={`soft-chip text-capitalize ${current.status === "complete" ? "text-success" : ""}`}>{current.status}</span>
                          </div>
                          <div className="small muted-copy mb-3">
                            {stage.key === "learn" && "Use the curated resource and existing lessons to understand the skill."}
                            {stage.key === "practice" && "Use quizzes or coding exercises. Qualifying results now feed career mastery automatically."}
                            {stage.key === "prove" && "Submit a real project, repository, or demo as evidence of the skill."}
                          </div>
                          {stage.key === "learn" && skillResources.length ? (
                            <div className="d-grid gap-2 mb-3">
                              {skillResources.slice(0, 2).map((resource) => (
                                <a key={resource._id} href={resource.url} target="_blank" rel="noreferrer" className="border rounded-3 p-2 text-decoration-none">
                                  <div className="small fw-semibold">{resource.title}</div>
                                  <div className="small text-muted">{resource.provider} · Free</div>
                                </a>
                              ))}
                            </div>
                          ) : null}
                          {stage.key === "prove" && current.status !== "complete" && skill.practice.status === "complete" ? (
                            <form onSubmit={(event) => submitProof(event, skill.skillKey)} className="d-grid gap-2">
                              <input className="form-control form-control-sm" placeholder="Project title" value={proof.skillKey === skill.skillKey ? proof.title : ""} onChange={(event) => setProof({ ...proof, skillKey: skill.skillKey, title: event.target.value })} />
                              <textarea className="form-control form-control-sm" rows="3" placeholder="What did you build and what skill does it demonstrate?" value={proof.skillKey === skill.skillKey ? proof.summary : ""} onChange={(event) => setProof({ ...proof, skillKey: skill.skillKey, summary: event.target.value })} />
                              <input className="form-control form-control-sm" placeholder="GitHub repository URL" value={proof.skillKey === skill.skillKey ? proof.repositoryUrl : ""} onChange={(event) => setProof({ ...proof, skillKey: skill.skillKey, repositoryUrl: event.target.value })} />
                              <input className="form-control form-control-sm" placeholder="Live demo URL (optional)" value={proof.skillKey === skill.skillKey ? proof.demoUrl : ""} onChange={(event) => setProof({ ...proof, skillKey: skill.skillKey, demoUrl: event.target.value })} />
                              <button type="submit" className="btn btn-primary btn-sm" disabled={busy === `proof:${skill.skillKey}` || !proof.title || !proof.summary}>
                                {busy === `proof:${skill.skillKey}` ? "Submitting…" : "Submit proof"}
                              </button>
                            </form>
                          ) : stage.key === "learn" && current.status !== "complete" ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={!canAct || Boolean(busy) || Boolean(previous && previous.status !== "complete")}
                              onClick={() => markComplete(skill.skillKey, stage.key)}
                            >
                              {busy === `${skill.skillKey}:${stage.key}` ? "Saving…" : "Complete Learn"}
                            </button>
                          ) : current.status === "complete" ? (
                            <div className="small text-success fw-semibold">✓ Completed</div>
                          ) : stage.key === "practice" ? (
                            <div className="small text-muted">Complete a qualifying quiz or coding exercise to unlock Prove.</div>
                          ) : (
                            <div className="small text-muted">Complete Practice first.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 d-flex gap-2">
          <button type="button" className="btn btn-outline-dark" onClick={() => router.push("/career-dashboard")}>Back to Career Dashboard</button>
          <button type="button" className="btn btn-outline-primary" onClick={() => router.push("/learning-paths")}>Open Learning Paths</button>
        </div>
      </div>
    </main>
  );
}
