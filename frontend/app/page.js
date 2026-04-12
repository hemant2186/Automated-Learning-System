"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import API, { createDemoSession } from "../lib/api";
import { clearAuth, storeAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const pathways = [
  {
    title: "Python Foundations",
    summary: "Start with syntax, variables, control flow, and functions through small coding wins.",
    accent: "#0d6efd"
  },
  {
    title: "Problem Solving",
    summary: "Grow from tracing logic to algorithms, debugging patterns, and structured thinking.",
    accent: "#198754"
  },
  {
    title: "Project Readiness",
    summary: "Bridge into databases, web development, and portfolio-grade beginner projects.",
    accent: "#d96c3f"
  }
];

const contentRows = [
  "Adaptive recommendations from learner behavior",
  "Progress tracking from logged study sessions",
  "Instructor analytics and cohort risk views",
  "Rule-based topic sequencing for novice programmers"
];

const startupStats = [
  { label: "Pilot-ready modules", value: "6" },
  { label: "Core learner signals", value: "8" },
  { label: "Instructor workflows", value: "5" },
  { label: "Platform surfaces", value: "7" }
];

const startupNarrative = [
  {
    title: "Problem",
    text: "Beginner programmers often get generic content when they actually need precise support around specific misconceptions."
  },
  {
    title: "Solution",
    text: "PathPilot AI turns learner behavior into targeted next steps using rules, analytics, and recommendation modeling."
  },
  {
    title: "Why now",
    text: "Bootcamps, schools, and self-paced platforms need more adaptive guidance without building a full AI layer from scratch."
  }
];

const heroBenefits = [
  "Personalized progress nudges",
  "Live instructor signals",
  "Task-based skill checkpoints"
];

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("Sign in to continue.");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    goals: ""
  });

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleRegister = async () => {
    const response = await API.post("/api/auth/register", {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      goals: form.goals
        .split(",")
        .map((goal) => goal.trim())
        .filter(Boolean)
    });
    storeAuth(response.data);
  };

  const handleLogin = async () => {
    const response = await API.post("/api/auth/login", {
      email: form.email,
      password: form.password
    });
    storeAuth(response.data);
    router.push("/dashboard");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("Working...");

    try {
      if (mode === "register") {
        await handleRegister();
        setStatus("Registration complete. Logging you in...");
        showToast("Registration complete.", "success");
      }
      if (mode !== "register") {
        await handleLogin();
      }
      showToast("Welcome back. Redirecting to dashboard.", "success");
    } catch (error) {
      setStatus(error.response?.data?.error || "Authentication failed.");
      showToast(error.response?.data?.error || "Authentication failed.", "danger");
    }
  };

  const launchDemo = async (role) => {
    try {
      setStatus(`Creating ${role} demo session...`);
      const response = await createDemoSession(role);
      storeAuth(response.data);
      showToast(`${role === "instructor" ? "Instructor" : "Student"} demo ready.`, "success");
      router.push(role === "instructor" ? "/instructor" : "/dashboard");
    } catch (error) {
      setStatus(error.response?.data?.error || "Could not create demo session.");
      showToast(error.response?.data?.error || "Could not create demo session.", "danger");
    }
  };

  return (
    <main className="page-shell">
      <section className="container py-4 py-lg-5">
        <div className="hero-panel p-4 p-lg-5 mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <div className="eyebrow mb-3">Premium AI Learning Experience</div>
              <h1 className="display-3 fw-bold mb-3">
                PathPilot AI helps novice programmers learn with guided practice, feedback, and adaptive next steps.
              </h1>
              <p className="fs-5 text-white-50 mb-4">
                Learners log study sessions, the system spots weak concepts early, and instructors get visibility into where extra help is needed.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <span className="feature-chip">Adaptive recommendations</span>
                <span className="feature-chip">MongoDB learner events</span>
                <span className="feature-chip">Instructor analytics</span>
                <span className="feature-chip">Beginner-friendly dashboard</span>
              </div>
              <div className="row g-3">
                <div className="col-sm-4">
                  <div className="glass-card rounded-4 p-3 h-100">
                    <div className="small text-white-50">Learning tracks</div>
                    <div className="big-stat">12+</div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="glass-card rounded-4 p-3 h-100">
                    <div className="small text-white-50">Signals tracked</div>
                    <div className="big-stat">8</div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="glass-card rounded-4 p-3 h-100">
                    <div className="small text-white-50">Feedback loop</div>
                    <div className="big-stat">24/7</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="glass-card rounded-5 p-4 p-lg-5">
                <div className="d-flex gap-2 mb-4">
                  <button
                    type="button"
                    className={`btn ${mode === "login" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setMode("login")}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`btn ${mode === "register" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setMode("register")}
                  >
                    Register
                  </button>
                  <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          clearAuth();
                          setStatus("Stored session cleared.");
                          showToast("Stored session cleared.", "secondary");
                        }}
                      >
                    Reset
                  </button>
                </div>

                <h3 className="fw-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h3>
                <p className="muted-copy">
                  {mode === "login"
                    ? "Continue your personalized learning path."
                    : "Start as a student or instructor and unlock the full product."}
                </p>

                <form className="vstack gap-3" onSubmit={handleSubmit}>
                  {mode === "register" && (
                    <>
                      <input
                        className="form-control form-control-lg"
                        name="name"
                        placeholder="Full name"
                        value={form.name}
                        onChange={updateField}
                        required
                      />
                      <select
                        className="form-select form-select-lg"
                        name="role"
                        value={form.role}
                        onChange={updateField}
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                      </select>
                      <input
                        className="form-control form-control-lg"
                        name="goals"
                        placeholder="Goals (comma separated)"
                        value={form.goals}
                        onChange={updateField}
                      />
                    </>
                  )}
                  <input
                    className="form-control form-control-lg"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={updateField}
                    required
                  />
                  <input
                    className="form-control form-control-lg"
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={updateField}
                    required
                  />
                  <button className="btn btn-primary btn-lg" type="submit">
                    {mode === "login" ? "Enter Dashboard" : "Register and Continue"}
                  </button>
                </form>

                <p className="small muted-copy mt-3 mb-0">{status}</p>
                <div className="page-divider my-4" />
                <div className="small muted-copy mb-3">Try the platform instantly with demo data.</div>
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-outline-dark" type="button" onClick={() => launchDemo("student")}>
                    Student Demo
                  </button>
                  <button className="btn btn-outline-success" type="button" onClick={() => launchDemo("instructor")}>
                    Instructor Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <div className="eyebrow text-primary mb-3">Launch with confidence</div>
              <h2 className="fw-bold mb-3">A polished homepage experience for learners and instructors alike.</h2>
              <p className="muted-copy mb-4">
                PathPilot AI is built to feel like a real SaaS platform from the first interaction. Clear steps, fast actions, and visible momentum help users engage immediately.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Preview the dashboard
                </Link>
                <Link href="/learning-paths" className="btn btn-outline-dark btn-lg">
                  Browse learning paths
                </Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="row g-3">
                {heroBenefits.map((benefit) => (
                  <div className="col-12" key={benefit}>
                    <div className="metric-tile p-3 h-100">
                      <div className="fw-semibold">{benefit}</div>
                      <div className="small text-muted">A better onboarding flow with immediate product clarity.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="section-card p-4 p-lg-5 h-100">
              <div className="eyebrow text-primary mb-2">Why Teams Choose This</div>
              <h2 className="fw-bold mb-3">A frontend that feels like a full product, not just a demo.</h2>
              <p className="muted-copy mb-4">
                We designed the experience around clarity, momentum, and instructional confidence.
                Students get guided progress, while instructors get real visibility into where support is needed.
              </p>
              <div className="row g-3">
                {contentRows.map((item) => (
                  <div className="col-md-6" key={item}>
                    <div className="metric-tile p-3 h-100">
                      <div className="d-flex align-items-start gap-3">
                        <span className="accent-dot mt-2" style={{ background: "var(--accent-2)" }} />
                        <div className="fw-semibold">{item}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="hero-panel-alt p-4 p-lg-5 h-100">
              <div className="eyebrow mb-3">What To Explore</div>
              <div className="d-flex flex-column gap-3">
                <Link href="/learning-paths" className="feature-chip justify-content-between">
                  Browse learning paths
                </Link>
                <Link href="/resources" className="feature-chip justify-content-between">
                  Discover curated resources
                </Link>
                <Link href="/about" className="feature-chip justify-content-between">
                  View platform story
                </Link>
                <Link href="/dashboard" className="feature-chip justify-content-between">
                  Jump to live dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
            <div>
              <div className="eyebrow text-primary mb-2">Path Collection</div>
              <h2 className="fw-bold mb-2">Three flagship journeys for beginner growth</h2>
              <p className="muted-copy mb-0">
                Each track combines assessment, practice, reflection, and recommendation loops.
              </p>
            </div>
            <Link href="/learning-paths" className="btn btn-outline-dark">
              Explore all paths
            </Link>
          </div>
          <div className="row g-4">
            {pathways.map((path) => (
              <div className="col-md-4" key={path.title}>
                <div className="metric-tile p-4 h-100">
                  <div className="soft-chip mb-3" style={{ color: path.accent, background: `${path.accent}12` }}>
                    Signature Track
                  </div>
                  <h4 className="fw-bold">{path.title}</h4>
                  <p className="muted-copy mb-0">{path.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row g-4 mb-4">
          {startupStats.map((item) => (
            <div className="col-md-6 col-xl-3" key={item.label}>
              <div className="startup-stat-card p-4 h-100">
                <div className="small muted-copy mb-2">{item.label}</div>
                <div className="big-stat">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-card p-4 p-lg-5">
          <div className="d-flex justify-content-between align-items-end flex-column flex-lg-row gap-3 mb-4">
            <div>
              <div className="eyebrow text-primary mb-2">Startup Narrative</div>
              <h2 className="fw-bold mb-0">Designed to look and feel like a real early-stage SaaS product</h2>
            </div>
            <span className="startup-tag">EdTech + AI + Analytics</span>
          </div>
          <div className="row g-4">
            {startupNarrative.map((item) => (
              <div className="col-lg-4" key={item.title}>
                <div className="metric-tile p-4 h-100">
                  <div className="eyebrow text-primary mb-2">{item.title}</div>
                  <h4 className="fw-bold">{item.title === "Why now" ? "Timing and market pull" : item.title}</h4>
                  <p className="muted-copy mb-0">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
