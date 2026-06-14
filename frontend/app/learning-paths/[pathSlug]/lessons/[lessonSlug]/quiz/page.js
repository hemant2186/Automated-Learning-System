"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import DashboardShell from "../../../../../../components/DashboardShell";
import { fetchQuiz, fetchQuizResults, submitQuiz } from "../../../../../../services/quizService";

function QuizPage() {
  const params = useParams();
  const lessonSlug = params?.lessonSlug;
  const pathSlug = params?.pathSlug;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQuiz() {
      setLoading(true);
      setError("");

      try {
        const [quizData, latestResult] = await Promise.all([
          fetchQuiz(lessonSlug),
          fetchQuizResults(lessonSlug).catch((err) => {
            if (err.response?.status === 404) {
              return null;
            }
            throw err;
          }),
        ]);

        if (active) {
          setQuiz(quizData);
          setResult(latestResult);
        }
      } catch (err) {
        if (active) {
          if (err.response?.status === 403) {
            setError("Enroll in this learning path before taking the quiz.");
          } else if (err.response?.status === 404) {
            setError("Quiz not found for this lesson.");
          } else {
            setError("Unable to load quiz.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (lessonSlug) {
      loadQuiz();
    }

    return () => {
      active = false;
    };
  }, [lessonSlug]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = quiz?.questions?.length || 0;

  const handleSelect = (questionId, optionKey) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionKey,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await submitQuiz(lessonSlug, answers);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderResult = () => {
    if (!result) {
      return null;
    }

    return (
      <div className="section-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="eyebrow text-primary mb-2">Latest result</div>
            <h2 className="h4 fw-bold mb-2">{result.score}% score</h2>
            <p className="muted-copy mb-0">
              {result.correct} of {result.total} answers correct.
            </p>
          </div>
          <span className={`soft-chip ${result.passed ? "text-success" : "text-danger"}`}>
            {result.passed ? "Passed" : "Not passed"}
          </span>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (loading) {
      return (
        <div className="section-card p-4">
          <div className="eyebrow text-primary mb-2">Loading quiz</div>
          <p className="muted-copy mb-0">Fetching assessment questions...</p>
        </div>
      );
    }

    if (error && !quiz) {
      return (
        <div className="section-card p-4">
          <div className="eyebrow text-primary mb-2">Unable to load quiz</div>
          <p className="muted-copy mb-0">{error}</p>
        </div>
      );
    }

    if (!quiz) {
      return null;
    }

    return (
      <>
        <div className="section-card p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
            <div>
              <div className="eyebrow text-primary mb-2">Quiz assessment</div>
              <h1 className="h3 fw-bold mb-2">{quiz.title}</h1>
              <p className="muted-copy mb-0">
                {answeredCount} of {totalQuestions} questions answered
              </p>
            </div>
            <Link
              href={`/learning-paths/${pathSlug}/lessons/${lessonSlug}`}
              className="btn btn-outline-secondary"
            >
              Back to lesson
            </Link>
          </div>
        </div>

        {renderResult()}

        {error ? (
          <div className="section-card p-4 mb-4 bg-danger-subtle">
            <div className="eyebrow text-danger mb-2">Quiz Error</div>
            <p className="muted-copy mb-0">{error}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="d-grid gap-3 mb-4">
            {quiz.questions.map((question, questionIndex) => (
              <div key={question.id} className="section-card p-4">
                <div className="d-flex justify-content-between gap-3 mb-3">
                  <div className="eyebrow text-primary">Question {questionIndex + 1}</div>
                  <span className="soft-chip">{answers[question.id] || "Open"}</span>
                </div>
                <h2 className="h5 fw-bold mb-3">{question.prompt}</h2>
                <div className="d-grid gap-2">
                  {Object.entries(question.options).map(([optionKey, optionText]) => (
                    <label
                      key={optionKey}
                      className="metric-tile p-3 d-flex align-items-start gap-3"
                      htmlFor={`${question.id}-${optionKey}`}
                    >
                      <input
                        id={`${question.id}-${optionKey}`}
                        type="radio"
                        className="form-check-input mt-1"
                        name={question.id}
                        value={optionKey}
                        checked={answers[question.id] === optionKey}
                        onChange={() => handleSelect(question.id, optionKey)}
                      />
                      <span>
                        <span className="fw-semibold me-2">{optionKey}.</span>
                        {optionText}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="section-card p-4 d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <p className="muted-copy mb-0">
              Unanswered questions count as incorrect.
            </p>
            <button type="submit" className="btn btn-primary" disabled={submitting || !totalQuestions}>
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <main className="page-shell">
      <DashboardShell
        title="Quiz"
        subtitle="Answer each question and submit your assessment for scoring."
      >
        {renderQuiz()}
      </DashboardShell>
    </main>
  );
}

export default QuizPage;
