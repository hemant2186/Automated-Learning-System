"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import DashboardShell from "../../../components/DashboardShell";
import ProgressBar from "../../../components/progress/ProgressBar";
import { fetchLearningPathBySlug } from "../../../services/learningPathService";
import { fetchPathEnrollment, enrollInPath } from "../../../services/progressService";
import { useToast } from "../../../components/ToastProvider";

function formatDifficulty(value) {
  if (!value) return "Beginner";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function LearningPathDetailPage() {
  const params = useParams();
  const pathSlug = params?.pathSlug;
  const { showToast } = useToast();

  const [path, setPath] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [pathResponse, enrollmentResponse] = await Promise.all([
          fetchLearningPathBySlug(pathSlug),
          fetchPathEnrollment(pathSlug),
        ]);

        if (active) {
          setPath(pathResponse);
          setEnrollment(enrollmentResponse.enrollment);
        }
      } catch (err) {
        if (active) {
          if (err.response?.status === 404) {
            setError("Learning path not found.");
            showToast("That learning path could not be found.", "danger");
          } else {
            setError("Unable to load learning path details.");
            showToast("Couldn't load this learning path right now.", "danger");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (pathSlug) {
      loadData();
    }

    return () => {
      active = false;
    };
  }, [pathSlug]);

  const handleEnroll = async () => {
    setSaving(true);
    setError("");

    try {
      const enrollmentResponse = await enrollInPath(pathSlug);
      setEnrollment(enrollmentResponse);
    } catch (err) {
      setError("Could not enroll in this path.");
      showToast("Couldn't enroll in this path right now.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBlock = () => {
    if (!path) {
      return null;
    }

    return (
      <div className="section-card p-4 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-lg-8">
            <div className="eyebrow mb-2">Path status</div>
            <h2 className="fw-bold mb-2">{path.title}</h2>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="soft-chip text-capitalize">{formatDifficulty(path.difficulty)}</span>
              <span className="soft-chip">{path.estimatedHours}h</span>
              <span className="soft-chip">{path.lessonCount} lessons</span>
            </div>
            <p className="muted-copy mb-0">{path.description}</p>
          </div>
          <div className="col-lg-4 text-lg-end">
            {enrollment ? (
              <>
                <div className="small text-white-50 mb-2">Enrolled</div>
                <div className="h3 mb-2">{enrollment.progressPercent}% complete</div>
                <div className="soft-chip text-uppercase mb-3">{enrollment.status}</div>
                {enrollment.currentLesson ? (
                  <Link
                    href={`/learning-paths/${path.slug}/lessons/${enrollment.currentLesson.slug}`}
                    className="btn btn-primary"
                  >
                    Continue lesson
                  </Link>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEnroll}
                disabled={saving}
              >
                {saving ? 'Enrolling…' : 'Enroll in this path'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderModules = () => {
    if (!path?.modules?.length) {
      return null;
    }

    return (
      <div className="section-card p-4 mb-4">
        <div className="eyebrow mb-3">Curriculum overview</div>
        {path.modules.map((module) => (
          <div key={module.id} className="mb-4">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
              <div>
                <h3 className="h5 mb-1">{module.title}</h3>
                <p className="muted-copy mb-0">{module.description}</p>
              </div>
              <span className="soft-chip">{module.lessonCount} lessons</span>
            </div>
            <div className="list-group list-group-flush">
              {module.lessons.map((lesson) => (
                <Link
                  href={`/learning-paths/${path.slug}/lessons/${lesson.slug}`}
                  key={lesson.id}
                  className="list-group-item list-group-item-action rounded-3 mb-2"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{lesson.title}</div>
                      <div className="small muted-copy">{lesson.topic}</div>
                    </div>
                    <span className="small text-white-50">{lesson.durationMinutes} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="page-shell">
      <DashboardShell
        title="Learning Path"
        subtitle="Review the path structure, enroll, and jump into the next lesson."
      >
        {loading ? (
          <div className="section-card p-4">
            <div className="eyebrow text-primary mb-2">Loading path</div>
            <p className="muted-copy mb-0">Fetching learning path details...</p>
          </div>
        ) : error ? (
          <div className="section-card p-4">
            <div className="eyebrow text-primary mb-2">Unable to load path</div>
            <p className="muted-copy mb-0">{error}</p>
          </div>
        ) : (
          <>
            {renderStatusBlock()}
            {enrollment ? (
              <div className="section-card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="eyebrow mb-2">Path progress</div>
                    <p className="muted-copy mb-0">Track your active path status and the lesson you should open next.</p>
                  </div>
                </div>
                <ProgressBar value={enrollment.progressPercent} max={100} label="Path completion" />
              </div>
            ) : null}
            {renderModules()}
          </>
        )}
      </DashboardShell>
    </main>
  );
}
