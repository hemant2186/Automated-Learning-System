"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DashboardShell from "../../../../../components/DashboardShell";
import { getExercise, getLesson, submitExercise } from "../../../../../lib/api";
import { useToast } from "../../../../../components/ToastProvider";

export default function CodingExercisePage() {
  const { pathSlug, lessonSlug } = useParams();
  const { showToast } = useToast();
  const [exercise, setExercise] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!pathSlug || !lessonSlug) return;
    getLesson(pathSlug, lessonSlug)
      .then((lessonResponse) => getExercise(lessonResponse.data.id))
      .then((exerciseResponse) => {
        setExercise(exerciseResponse.data);
        setCode(exerciseResponse.data.starterCode || "");
      })
      .catch(() => {
        setError("Could not load this exercise.");
        showToast("Couldn't load this exercise right now. Please try again.", "danger");
      });
  }, [pathSlug, lessonSlug]);

  const handleSubmit = async () => {
    setError("");
    try {
      const response = await submitExercise(exercise.id, {
        code,
        timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setResult(response.data);
    } catch (requestError) {
      setError("Could not run this exercise.");
      showToast("Couldn't run this exercise right now. Please try again.", "danger");
    }
  };

  return (
    <main className="page-shell">
      <DashboardShell title={exercise?.title || "Coding exercise"} subtitle="Write code, run it against the checks, and review your score.">
        {error ? <div className="section-card p-4 mb-4 text-danger">{error}</div> : null}
        {!exercise && !error ? <div className="section-card p-4">Loading exercise...</div> : null}
        {exercise ? (
          <>
            <section className="section-card p-4 mb-4">
              <div className="eyebrow mb-2">{exercise.language}</div>
              <p className="mb-4">{exercise.prompt}</p>
              <div className="d-grid gap-3 mb-4">
                {exercise.testCases.map((testCase, index) => (
                  <div className="border rounded-3 p-3" key={`${testCase.input}-${index}`}>
                    <div className="small muted-copy">Visible test {index + 1}</div>
                    <div><strong>Input:</strong> <code>{testCase.input || "(none)"}</code></div>
                    <div><strong>Expected output:</strong> <code>{testCase.expectedOutput}</code></div>
                  </div>
                ))}
              </div>
              {/* A textarea keeps v1 dependency-free; Monaco or CodeMirror is a good v2 upgrade. */}
              <textarea
                className="form-control bg-dark text-light"
                style={{ minHeight: "20rem", fontFamily: "monospace" }}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck="false"
                aria-label="Code editor"
              />
              <button type="button" className="btn btn-primary mt-3" onClick={handleSubmit}>Run &amp; Submit</button>
            </section>
            {result ? (
              <section className="section-card p-4">
                <div className="eyebrow mb-2">Result</div>
                <h2 className="h3">{result.score}% {result.passed ? "Passed" : "Needs another attempt"}</h2>
                <div className="d-grid gap-3 mt-3">
                  {result.testResults.map((testResult, index) => (
                    <div className="border rounded-3 p-3" key={`${testResult.hidden ? "hidden" : "visible"}-${index}`}>
                      {testResult.hidden ? `Hidden test ${index + 1}: ${testResult.passed ? "✅" : "❌"}` : (
                        <>
                          <div>{testResult.passed ? "Passed" : "Failed"}</div>
                          <div className="small muted-copy">Output: {testResult.actualOutput || "(none)"}</div>
                          {testResult.error ? <div className="small text-danger">{testResult.error}</div> : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <Link className="btn btn-outline-dark mt-4" href={`/learn/${pathSlug}/${lessonSlug}`}>Back to lesson</Link>
              </section>
            ) : null}
          </>
        ) : null}
      </DashboardShell>
    </main>
  );
}