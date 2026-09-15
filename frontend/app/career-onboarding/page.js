"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../lib/api";

const EXPERIENCE = ["beginner", "intermediate", "advanced"];
const HOURS = [5, 10, 15, 20];
const TIMELINES = [8, 12, 16, 24];

export default function CareerOnboardingPage() {
  const router = useRouter();
  const [careers, setCareers] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ careerSlug: "", experienceLevel: "beginner", currentSkills: [], hoursPerWeek: 10, targetWeeks: 16, targetRole: "" });

  useEffect(() => {
    API.get("/api/careers")
      .then((response) => {
        const items = response.data || [];
        setCareers(items);
        if (items[0]) setForm((current) => ({ ...current, careerSlug: items[0].slug, targetRole: items[0].targetRoles?.[0] || "" }));
      })
      .catch(() => setError("Could not load careers."))
      .finally(() => setLoading(false));
  }, []);

  const selectedCareer = useMemo(() => careers.find((career) => career.slug === form.careerSlug), [careers, form.careerSlug]);
  const toggleSkill = (skill) => setForm((current) => ({ ...current, currentSkills: current.currentSkills.includes(skill) ? current.currentSkills.filter((item) => item !== skill) : [...current.currentSkills, skill] }));
  const next = () => { setError(""); setStep((current) => Math.min(5, current + 1)); };
  const back = () => setStep((current) => Math.max(1, current - 1));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await API.post("/api/onboarding", { skillLevel: form.experienceLevel, goals: [form.careerSlug] });
      await API.post("/api/careers/me/plan", form);
      router.push("/career-dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not save your career plan.");
    } finally { setSaving(false); }
  };

  if (loading) return <main className="container py-5"><div className="section-card p-5">Loading career setup…</div></main>;

  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 920 }}>
        <div className="mb-4"><div className="eyebrow text-primary mb-2">Career Setup</div><h1 className="display-6 fw-bold mb-2">Build your learning roadmap around a real career goal.</h1><p className="muted-copy">We will use your answers to decide what to learn, what to skip, and what to prioritize next.</p></div>
        <div className="section-card p-4 p-lg-5">
          <div className="d-flex justify-content-between align-items-center mb-4"><div className="small fw-semibold">Step {step} of 5</div><div className="small text-muted">{step === 5 ? "Ready to build" : "Personalize your path"}</div></div>
          <div className="progress mb-5" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${step * 20}%` }} /></div>
          {step === 1 && <><h2 className="fw-bold mb-2">What do you want to become?</h2><p className="muted-copy mb-4">Start with one destination.</p><div className="row g-3">{careers.map((career) => <div className="col-md-6" key={career.slug}><button type="button" className={`w-100 text-start metric-tile p-4 border rounded-4 ${form.careerSlug === career.slug ? "border-primary border-2" : ""}`} onClick={() => setForm((current) => ({ ...current, careerSlug: career.slug, targetRole: career.targetRoles?.[0] || "" }))}><div className="d-flex justify-content-between gap-3"><div><div className="fw-bold fs-5">{career.title}</div><div className="small text-muted mt-2">{career.description}</div></div>{form.careerSlug === career.slug ? <span className="badge text-bg-primary">Selected</span> : null}</div></button></div>)}</div></>}
          {step === 2 && <><h2 className="fw-bold mb-2">What is your current level?</h2><p className="muted-copy mb-4">This changes how aggressive your starting roadmap is.</p><div className="row g-3">{EXPERIENCE.map((level) => <div className="col-md-4" key={level}><button type="button" className={`w-100 metric-tile p-4 border rounded-4 ${form.experienceLevel === level ? "border-primary border-2" : ""}`} onClick={() => setForm((current) => ({ ...current, experienceLevel: level }))}><div className="fw-bold text-capitalize">{level}</div><div className="small text-muted mt-2">{level === "beginner" ? "New to most core skills." : level === "intermediate" ? "Comfortable with some relevant skills." : "Already have strong foundations."}</div></button></div>)}</div></>}
          {step === 3 && selectedCareer && <><h2 className="fw-bold mb-2">What do you already know?</h2><p className="muted-copy mb-4">Select skills you can use confidently today.</p><div className="d-flex flex-wrap gap-2">{selectedCareer.skills.map((skill) => { const selected = form.currentSkills.includes(skill.key); return <button type="button" key={skill.key} className={`btn rounded-pill ${selected ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => toggleSkill(skill.key)}>{skill.title}</button>; })}</div></>}
          {step === 4 && <><h2 className="fw-bold mb-2">How much time can you study?</h2><p className="muted-copy mb-4">Choose a sustainable weekly target.</p><div className="row g-3 mb-4">{HOURS.map((hours) => <div className="col-6 col-md-3" key={hours}><button type="button" className={`w-100 metric-tile p-4 border rounded-4 ${form.hoursPerWeek === hours ? "border-primary border-2" : ""}`} onClick={() => setForm((current) => ({ ...current, hoursPerWeek: hours }))}><div className="fw-bold fs-4">{hours}h</div><div className="small text-muted">per week</div></button></div>)}</div><h3 className="fw-bold fs-5">Target timeline</h3><div className="d-flex flex-wrap gap-2 mt-3">{TIMELINES.map((weeks) => <button type="button" key={weeks} className={`btn rounded-pill ${form.targetWeeks === weeks ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => setForm((current) => ({ ...current, targetWeeks: weeks }))}>{weeks} weeks</button>)}</div></>}
          {step === 5 && selectedCareer && <><h2 className="fw-bold mb-2">What role are you targeting?</h2><p className="muted-copy mb-4">This gives the roadmap a specific employment destination.</p><select className="form-select form-select-lg mb-4" value={form.targetRole} onChange={(event) => setForm((current) => ({ ...current, targetRole: event.target.value }))}>{selectedCareer.targetRoles?.map((role) => <option value={role} key={role}>{role}</option>)}</select><div className="row g-3"><div className="col-md-4"><div className="metric-tile p-3 h-100"><div className="small text-muted">Career</div><div className="fw-bold mt-1">{selectedCareer.title}</div></div></div><div className="col-md-4"><div className="metric-tile p-3 h-100"><div className="small text-muted">Weekly commitment</div><div className="fw-bold mt-1">{form.hoursPerWeek} hours</div></div></div><div className="col-md-4"><div className="metric-tile p-3 h-100"><div className="small text-muted">Timeline</div><div className="fw-bold mt-1">{form.targetWeeks} weeks</div></div></div></div></>}
          {error ? <div className="alert alert-danger mt-4">{error}</div> : null}
          <div className="d-flex justify-content-between mt-5"><button type="button" className="btn btn-outline-secondary" disabled={step === 1 || saving} onClick={back}>Back</button>{step < 5 ? <button type="button" className="btn btn-primary" disabled={!form.careerSlug} onClick={next}>Continue</button> : <button type="button" className="btn btn-primary btn-lg" disabled={!form.targetRole || saving} onClick={submit}>{saving ? "Building roadmap…" : "Build My Roadmap"}</button>}</div>
        </div>
      </div>
    </main>
  );
}
