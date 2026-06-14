"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

import DashboardShell from "../../../../../components/DashboardShell";
import { fetchLessonBySlug } from "../../../../../services/lessonService";
import { completeLesson } from "../../../../../services/progressService";

function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const lessonSlug = params?.lessonSlug;
  const pathSlug = params?.pathSlug;

  useEffect(() => {
    let isMounted = true;

    async function loadLesson() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchLessonBySlug(lessonSlug);

        if (isMounted) {
          setLesson(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 404) {
            setError("Lesson not found.");
          } else {
            setError("Unable to load lesson content.");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (lessonSlug) {
      loadLesson();
    }

    return () => {
      isMounted = false;
    };
  }, [lessonSlug]);

  const navigateToLesson = (slug) => {
    if (!slug) {
      return;
    }
    router.push(`/learning-paths/${pathSlug}/lessons/${slug}`);
  };

  const handleMarkComplete = async () => {
    setCompletionLoading(true);
    setCompletionError("");

    try {
      await completeLesson(lessonSlug);
      setIsCompleted(true);
    } catch (err) {
      console.error("Completion error:", err);
      setCompletionError(err.response?.data?.error || "Could not mark lesson as complete.");
    } finally {
      setCompletionLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="section-card p-4">
          <div className="eyebrow text-primary mb-2">Loading lesson</div>
          <p className="muted-copy mb-0">Fetching lesson content from PathPilot...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="section-card p-4">
          <div className="eyebrow text-primary mb-2">Unable to load lesson</div>
          <p className="muted-copy mb-0">{error}</p>
        </div>
      );
    }

    if (!lesson) {
      return (
        <div className="section-card p-4">
          <div className="eyebrow text-primary mb-2">Lesson unavailable</div>
          <p className="muted-copy mb-0">This lesson cannot be displayed.</p>
        </div>
      );
    }

    return (
      <>
        <div className="section-card p-4 mb-4">
          <div className="mb-3">
            <nav aria-label="Breadcrumb">
              <div className="muted-copy small text-white-50">
                <Link href="/learning-paths" className="text-white-50">
                  Learning Paths
                </Link>
                <span className="mx-2">›</span>
                <Link href={`/learning-paths/${lesson.path.slug}`} className="text-white-50">
                  {lesson.path.title}
                </Link>
                <span className="mx-2">›</span>
                <span>{lesson.module.title}</span>
                <span className="mx-2">›</span>
                <span className="text-white">{lesson.title}</span>
              </div>
            </nav>
          </div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="eyebrow mb-2">{lesson.topic}</div>
              <h1 className="display-6 fw-bold mb-3">{lesson.title}</h1>
              <p className="muted-copy mb-0">Estimated duration: {lesson.durationMinutes} minutes</p>
            </div>
            <div className="text-end">
              <div className="soft-chip">{lesson.module.title}</div>
              <div className="soft-chip mt-2">{lesson.path.title}</div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 mb-4">
          <div className="mb-4">
            <div className="eyebrow mb-2">Lesson content</div>
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>

          {lesson.exampleCode?.code ? (
            <div className="mb-4">
              <div className="eyebrow mb-2">Example code</div>
              <div className="code-block p-3 rounded-3 bg-dark text-white overflow-auto">
                <div className="small text-muted mb-2">{lesson.exampleCode.language}</div>
                <pre className="mb-0">
                  <code>{lesson.exampleCode.code}</code>
                </pre>
              </div>
            </div>
          ) : null}

          {lesson.practice?.prompt ? (
            <div>
              <div className="eyebrow mb-2">Practice</div>
              <p className="mb-3">{lesson.practice.prompt}</p>
              {lesson.practice.hints?.length ? (
                <ul>
                  {lesson.practice.hints.map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {completionError && (
          <div className="section-card p-4 mb-4 bg-danger-subtle">
            <div className="eyebrow text-danger mb-2">Completion Error</div>
            <p className="muted-copy mb-0">{completionError}</p>
          </div>
        )}

        {isCompleted && (
          <div className="section-card p-4 mb-4 bg-success-subtle">
            <div className="eyebrow text-success mb-2">Lesson Completed</div>
            <p className="muted-copy mb-0">Great work! You've completed this lesson. Continue to the next lesson.</p>
          </div>
        )}

        <div className="section-card p-4 d-flex justify-content-between gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigateToLesson(lesson.previousLesson?.slug)}
            disabled={!lesson.previousLesson}
          >
            Previous Lesson
          </button>
          {lesson.hasQuiz ? (
            <Link
              href={`/learning-paths/${pathSlug}/lessons/${lessonSlug}/quiz`}
              className="btn btn-outline-success"
            >
              Take Quiz
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn-success"
            onClick={handleMarkComplete}
            disabled={isCompleted || completionLoading}
          >
            {completionLoading ? "Marking Complete..." : isCompleted ? "Completed ✓" : "Mark Complete"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigateToLesson(lesson.nextLesson?.slug)}
            disabled={!lesson.nextLesson}
          >
            Next Lesson
          </button>
        </div>
      </>
    );
  };

  return (
    <main className="page-shell">
      <DashboardShell
        title="Lesson Viewer"
        subtitle="Read the lesson, review examples, and move to the next topic."
      >
        {renderContent()}
      </DashboardShell>
    </main>
  );
}

export default LessonViewerPage;
