"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DashboardShell from "../../../components/DashboardShell";
import { getLessonsForPath } from "../../../lib/api";
import { useToast } from "../../../components/ToastProvider";

export default function LessonListPage() {
  const { pathSlug } = useParams();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pathSlug) return;
    getLessonsForPath(pathSlug)
      .then((response) => setData(response.data))
      .catch(() => {
        setError("Could not load lessons.");
        showToast("Couldn't load lessons right now. Please try again.", "danger");
      });
  }, [pathSlug]);

  return (
    <main className="page-shell">
      <DashboardShell
        title={data?.path?.title || "Learning path"}
        subtitle="Work through each lesson in sequence and test your understanding when a quiz is available."
      >
        {error ? <div className="section-card p-4 text-danger">{error}</div> : null}
        {!data && !error ? <div className="section-card p-4">Loading lessons...</div> : null}
        {data?.modules?.map((module) => (
          <section className="section-card p-4 mb-4" key={module.slug}>
            <div className="eyebrow mb-2">Module {module.order}</div>
            <h2 className="h3 mb-3">{module.title}</h2>
            <div className="list-group list-group-flush">
              {module.lessons.map((lesson) => (
                <Link
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  href={`/learn/${pathSlug}/${lesson.slug}`}
                  key={lesson.id}
                >
                  <span>
                    <span className="fw-semibold d-block">{lesson.title}</span>
                    <span className="small muted-copy">{lesson.durationMinutes} minutes</span>
                  </span>
                  {lesson.hasQuiz ? <span className="soft-chip">Quiz</span> : null}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </DashboardShell>
    </main>
  );
}
