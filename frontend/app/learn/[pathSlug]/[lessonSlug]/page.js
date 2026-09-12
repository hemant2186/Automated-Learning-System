"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

import DashboardShell from "../../../../components/DashboardShell";
import { getLesson } from "../../../../lib/api";
import { useToast } from "../../../../components/ToastProvider";

export default function LessonPage() {
  const { pathSlug, lessonSlug } = useParams();
  const { showToast } = useToast();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (!pathSlug || !lessonSlug) return;
    getLesson(pathSlug, lessonSlug)
      .then((response) => setLesson(response.data))
      .catch(() => {
        setError("Could not load this lesson.");
        showToast("Couldn't load this lesson right now. Please try again.", "danger");
      });
  }, [pathSlug, lessonSlug]);

  if (error) {
    return <main className="page-shell"><DashboardShell title="Lesson unavailable" subtitle=""><div className="section-card p-4 text-danger">{error}</div></DashboardShell></main>;
  }

  return (
    <main className="page-shell">
      <DashboardShell
        title={lesson?.title || "Lesson"}
        subtitle={lesson ? `${lesson.module.title} · ${lesson.durationMinutes} minutes` : "Loading lesson content..."}
        actions={lesson ? (
          <>
            {lesson.hasCodeExercise ? <Link className="btn btn-outline-primary" href={`/learn/${pathSlug}/${lessonSlug}/exercise`}>Open coding exercise</Link> : null}
            {lesson.hasQuiz ? <Link className="btn btn-primary" href={`/learn/${pathSlug}/${lessonSlug}/quiz`}>Take the quiz</Link> : null}
          </>
        ) : null}
      >
        {lesson ? (
          <>
            <article className="section-card p-4 p-lg-5 mb-4">
              <div className="lesson-markdown"><ReactMarkdown>{lesson.content || ""}</ReactMarkdown></div>
              {lesson.exampleCode?.code ? (
                <pre className="bg-dark text-light rounded-3 p-4 mt-4 overflow-auto"><code>{lesson.exampleCode.code}</code></pre>
              ) : null}
            </article>
            <section className="section-card p-4 mb-4">
              <div className="eyebrow mb-2">Practice</div>
              <h2 className="h4">Try it yourself</h2>
              <p>{lesson.practice?.prompt}</p>
              {lesson.practice?.starterCode ? <pre className="bg-dark text-light rounded-3 p-3 overflow-auto"><code>{lesson.practice.starterCode}</code></pre> : null}
              {lesson.practice?.hints?.length ? (
                <>
                  <button type="button" className="btn btn-outline-primary" onClick={() => setShowHints((value) => !value)}>
                    {showHints ? "Hide hints" : "Reveal hint"}
                  </button>
                  {showHints ? <ul className="mt-3">{lesson.practice.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul> : null}
                </>
              ) : null}
            </section>
            <nav className="d-flex justify-content-between gap-3">
              {lesson.previousLesson ? <Link className="btn btn-outline-dark" href={`/learn/${pathSlug}/${lesson.previousLesson.slug}`}>Previous lesson</Link> : <span />}
              {lesson.nextLesson ? <Link className="btn btn-primary" href={`/learn/${pathSlug}/${lesson.nextLesson.slug}`}>Next lesson</Link> : null}
            </nav>
          </>
        ) : <div className="section-card p-4">Loading lesson content...</div>}
      </DashboardShell>
    </main>
  );
}
