"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardShell from "../../components/DashboardShell";
import FilterChips from "../../components/catalog/FilterChips";
import SearchBar from "../../components/catalog/SearchBar";
import { PATH_CATEGORIES } from "../../lib/constants/categories";
import { fetchCatalog } from "../../services/catalogService";

const DIFFICULTY_OPTIONS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

function formatDifficulty(value) {
  if (!value) {
    return "All levels";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildMilestones(path) {
  const milestones = [];

  if (path.lessonCount) {
    milestones.push(`${path.lessonCount} guided lessons`);
  }

  if (path.quizCount) {
    milestones.push(`${path.quizCount} knowledge checks`);
  }

  if (path.projectCount) {
    milestones.push(`${path.projectCount} portfolio projects`);
  }

  if (milestones.length) {
    return milestones;
  }

  return (path.tags || []).slice(0, 3);
}

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await fetchCatalog({
          category,
          difficulty,
          search: debouncedSearch,
          sort: "order",
        });

        if (!cancelled) {
          setPaths(result.items || []);
        }
      } catch (catalogError) {
        if (!cancelled) {
          setPaths([]);
          setError(
            catalogError.response?.data?.error ||
              "Could not load learning paths right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCatalog().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [category, difficulty, debouncedSearch]);

  const featuredPath = paths[0];

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
                <div className="h3 fw-bold">
                  {featuredPath
                    ? `Start with ${featuredPath.title}`
                    : "Match a path to your current mastery level"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search learning paths"
              />
            </div>
            <div className="col-lg-7">
              <FilterChips
                label="Category"
                options={PATH_CATEGORIES}
                value={category}
                onChange={setCategory}
              />
            </div>
            <div className="col-12">
              <FilterChips
                label="Difficulty"
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="section-card p-4 p-lg-5 mb-4">
            <div className="eyebrow text-primary mb-2">Loading catalog</div>
            <p className="muted-copy mb-0">Fetching learning paths from PathPilot...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="section-card p-4 p-lg-5 mb-4">
            <div className="eyebrow text-primary mb-2">Catalog unavailable</div>
            <p className="muted-copy mb-0">{error}</p>
          </div>
        ) : null}

        {!loading && !error && paths.length === 0 ? (
          <div className="section-card p-4 p-lg-5 mb-4">
            <div className="eyebrow text-primary mb-2">No paths found</div>
            <p className="muted-copy mb-0">
              Try clearing your filters or search term to see more learning paths.
            </p>
          </div>
        ) : null}

        {!loading && !error && paths.length > 0 ? (
          <div className="row g-4 mb-4">
            {paths.map((path) => (
              <div className="col-lg-4" key={path.id}>
                <div className="section-card p-4 h-100">
                  <div className="soft-chip mb-3 text-capitalize">
                    {formatDifficulty(path.difficulty)} · {path.estimatedHours}h
                  </div>
                  <h3 className="fw-bold">{path.title}</h3>
                  <p className="muted-copy">{path.description}</p>
                  <ul className="list-unstyled d-grid gap-2 mb-0">
                    {buildMilestones(path).map((milestone) => (
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
        ) : null}

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
