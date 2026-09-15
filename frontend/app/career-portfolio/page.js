"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCareerPortfolio, getCareerResume, saveCareerProfile } from "../../lib/api";

const emptyProfile = {
  headline: "",
  summary: "",
  location: "",
  phone: "",
  linkedinUrl: "",
  githubUrl: "",
  websiteUrl: "",
};

function resumeText(resume) {
  if (!resume) return "";
  const lines = [
    resume.contact.name,
    resume.headline,
    [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" | "),
    [resume.contact.linkedinUrl, resume.contact.githubUrl, resume.contact.websiteUrl].filter(Boolean).join(" | "),
    "",
    "SUMMARY",
    resume.summary,
    "",
    "SKILLS",
    ...(resume.skills.length ? [resume.skills.join(", ")] : ["No verified skills yet."]),
    "",
    "PROJECTS",
  ];
  resume.projects.forEach((project) => {
    lines.push(`${project.title} — ${project.skill}`);
    lines.push(project.summary);
    if (project.repositoryUrl) lines.push(`Repository: ${project.repositoryUrl}`);
    if (project.demoUrl) lines.push(`Demo: ${project.demoUrl}`);
    lines.push("");
  });
  if (resume.experience?.length) {
    lines.push("EXPERIENCE");
    resume.experience.forEach((item) => {
      lines.push(`${item.role} — ${item.company}`);
      lines.push([item.startDate, item.endDate].filter(Boolean).join(" – "));
      lines.push(item.description || "");
      lines.push("");
    });
  }
  if (resume.education?.length) {
    lines.push("EDUCATION");
    resume.education.forEach((item) => {
      lines.push(`${item.degree} — ${item.institution} ${item.year ? `(${item.year})` : ""}`);
    });
  }
  return lines.join("\n");
}

export default function CareerPortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(null);
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [portfolioResponse, resumeResponse] = await Promise.all([
        getCareerPortfolio(),
        getCareerResume(),
      ]);
      const portfolioData = portfolioResponse.data;
      if (!portfolioData?.career) {
        router.push("/career-onboarding");
        return;
      }
      setPortfolio(portfolioData);
      setResume(resumeResponse.data);
      setProfile({ ...emptyProfile, ...(portfolioData.profile || {}) });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not load your portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await saveCareerProfile(profile);
      await load();
      setMessage("Profile saved. Your portfolio and resume were regenerated from the latest verified evidence.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const downloadResume = () => {
    const blob = new Blob([resumeText(resume)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "career-resume.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <main className="container py-5"><div className="section-card p-5">Building your portfolio from verified career evidence…</div></main>;
  if (error && !portfolio) return <main className="container py-5"><div className="alert alert-danger">{error}</div></main>;

  return (
    <main className="page-shell">
      <div className="container py-4 py-lg-5">
        <div className="hero-panel p-4 p-lg-5 mb-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 align-items-end">
            <div>
              <div className="eyebrow mb-2">Career Assets</div>
              <h1 className="display-6 fw-bold mb-2">Portfolio + Resume</h1>
              <p className="text-white-50 mb-0">Your strongest claims come from skills you actually proved.</p>
            </div>
            <button type="button" className="btn btn-light" onClick={() => router.push("/career-dashboard")}>Back to dashboard</button>
          </div>
        </div>

        {message ? <div className="alert alert-success">{message}</div> : null}
        {error ? <div className="alert alert-warning">{error}</div> : null}

        <div className="row g-4">
          <div className="col-lg-5">
            <section className="section-card p-4 h-100">
              <div className="eyebrow text-primary mb-2">Profile</div>
              <h2 className="h4 fw-bold mb-3">Complete your professional details</h2>
              <form onSubmit={save} className="d-grid gap-3">
                {[["headline","Professional headline"],["location","Location"],["phone","Phone"],["linkedinUrl","LinkedIn URL"],["githubUrl","GitHub URL"],["websiteUrl","Website URL"]].map(([key,label]) => (
                  <label key={key} className="small fw-semibold">
                    {label}
                    <input className="form-control mt-1" value={profile[key] || ""} onChange={(event) => update(key, event.target.value)} />
                  </label>
                ))}
                <label className="small fw-semibold">
                  Professional summary
                  <textarea className="form-control mt-1" rows="6" value={profile.summary || ""} onChange={(event) => update("summary", event.target.value)} placeholder="Leave blank to generate a conservative summary from verified skills." />
                </label>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
              </form>
            </section>
          </div>

          <div className="col-lg-7">
            <section className="section-card p-4 mb-4">
              <div className="eyebrow text-primary mb-2">Verified skills</div>
              <h2 className="h4 fw-bold mb-3">What your portfolio can credibly claim</h2>
              <div className="row g-2">
                {portfolio.verifiedSkills.map((skill) => (
                  <div className="col-md-6" key={skill.skillKey}>
                    <div className="metric-tile p-3 h-100">
                      <div className="d-flex justify-content-between gap-2">
                        <strong>{skill.title}</strong>
                        <span className={`badge ${skill.verified ? "text-bg-success" : "text-bg-secondary"}`}>{skill.verified ? "Proved" : `${skill.currentLevel}%`}</span>
                      </div>
                      <div className="small muted-copy mt-2">Target {skill.targetLevel}% · {skill.importance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-card p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <div className="eyebrow text-primary mb-2">Resume generator</div>
                  <h2 className="h4 fw-bold mb-0">Evidence-backed resume</h2>
                </div>
                <button type="button" className="btn btn-outline-primary" onClick={downloadResume}>Download TXT</button>
              </div>
              <div className="border rounded-4 p-4 bg-white">
                <h3 className="h3 fw-bold mb-1">{resume?.contact?.name}</h3>
                <div className="fw-semibold text-primary">{resume?.headline}</div>
                <div className="small text-muted mt-2">{[resume?.contact?.email, resume?.contact?.phone, resume?.contact?.location].filter(Boolean).join(" · ")}</div>
                <hr />
                <h4 className="h6 fw-bold">SUMMARY</h4>
                <p className="small">{resume?.summary}</p>
                <h4 className="h6 fw-bold">VERIFIED SKILLS</h4>
                <p className="small">{resume?.skills?.join(" · ") || "No verified skills yet."}</p>
                <h4 className="h6 fw-bold">PROJECT PROOF</h4>
                {(resume?.projects || []).map((project) => (
                  <div className="border rounded-3 p-3 mb-2" key={`${project.title}-${project.skill}`}>
                    <div className="fw-semibold">{project.title}</div>
                    <div className="small text-primary">{project.skill}</div>
                    <div className="small mt-1">{project.summary}</div>
                    {project.repositoryUrl ? <div className="small mt-1">Repo: {project.repositoryUrl}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
