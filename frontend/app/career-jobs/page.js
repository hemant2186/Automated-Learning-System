"use client";

import { useEffect, useState } from "react";
import { analyzeCareerJob, getCareerJobs } from "../../lib/api";

export default function CareerJobsPage() {
  const [form, setForm] = useState({ title: "", company: "", description: "" });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getCareerJobs().then((r) => setHistory(r.data || [])).catch(() => {}); }, []);

  const analyze = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await analyzeCareerJob(form);
      setResult(r.data);
      const h = await getCareerJobs();
      setHistory(h.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Could not analyze the job.");
    } finally { setBusy(false); }
  };

  return (
    <main className="page-shell"><div className="container py-4 py-lg-5">
      <div className="hero-panel p-4 p-lg-5 mb-4"><div className="eyebrow mb-2">Job Fit Engine</div><h1 className="display-6 fw-bold mb-2">Analyze a real job</h1><p className="text-white-50 mb-0">Map a job description to your verified Career Skill Graph.</p></div>
      {error ? <div className="alert alert-warning">{error}</div> : null}
      <div className="row g-4">
        <div className="col-lg-5"><section className="section-card p-4"><div className="eyebrow text-primary mb-2">Job description</div><form onSubmit={analyze} className="d-grid gap-3">
          <input className="form-control" placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="form-control" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea className="form-control" rows="16" minLength={80} required placeholder="Paste the full job description…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn btn-primary" disabled={busy}>{busy ? "Analyzing…" : "Analyze skill gap"}</button>
        </form></section></div>
        <div className="col-lg-7">{result ? <>
          <section className="section-card p-4 mb-4"><div className="d-flex justify-content-between gap-3"><div><div className="eyebrow text-primary">Job fit</div><h2 className="h3 fw-bold">{result.title || result.targetRole}</h2><div className="muted-copy">{result.company}</div></div><div className="d-flex gap-2"><div className="metric-tile p-3 text-center"><div className="h3">{result.matchScore}%</div><small>Match</small></div><div className="metric-tile p-3 text-center"><div className="h3">{result.readinessScore}%</div><small>Ready</small></div></div></div><hr/><div className="small">Mapped {result.extractedSkills.length} skills · {result.missingSkills.length} skill gaps · {result.evidenceGaps.length} evidence gaps</div></section>
          <section className="section-card p-4 mb-4"><div className="eyebrow text-primary">Skill assessment</div><div className="d-grid gap-2 mt-3">{result.skillAssessment.map((s) => <div className="border rounded-4 p-3" key={s.skillKey}><div className="d-flex justify-content-between"><strong>{s.title}</strong><span className="badge">{s.status}</span></div><div className="small muted-copy">Mastery {s.masteryPercent}% · target {s.targetLevel}% · {s.practiceComplete ? "practice verified" : "practice missing"} · {s.proven ? "proof present" : "proof missing"}</div></div>)}</div></section>
          <section className="section-card p-4"><div className="eyebrow text-primary">Next actions</div><div className="d-grid gap-2 mt-3">{result.nextActions.map((a, i) => <div className="border rounded-4 p-3" key={i}>{a}</div>)}</div></section>
        </> : <section className="section-card p-5 h-100 d-flex flex-column justify-content-center text-center"><div className="eyebrow text-primary">Ready</div><h2 className="h3 fw-bold">Turn a job posting into a concrete learning plan.</h2><p className="muted-copy">The analysis separates missing skill from missing proof.</p></section>}</div>
      </div>
      {history.length ? <section className="section-card p-4 mt-4"><div className="eyebrow text-primary">Recent analyses</div><div className="row g-2 mt-2">{history.slice(0, 6).map((j) => <div className="col-lg-4" key={j._id}><button className="btn btn-outline-secondary w-100 text-start p-3" onClick={() => getCareerJobs().then(() => setResult(j))}><strong>{j.title || j.targetRole}</strong><div className="small muted-copy">{j.company || "Saved analysis"} · {j.matchScore}% match</div></button></div>)}</div></section> : null}
    </div></main>
  );
}
