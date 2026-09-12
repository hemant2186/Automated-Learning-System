"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DashboardShell from "../../../../../components/DashboardShell";
import { getLesson, getQuiz, submitQuiz } from "../../../../../lib/api";
import { useToast } from "../../../../../components/ToastProvider";

export default function QuizPage() {
  const { pathSlug, lessonSlug } = useParams();
  const { showToast } = useToast();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!pathSlug || !lessonSlug) return;
    getLesson(pathSlug, lessonSlug)
      .then((lessonResponse) => getQuiz(lessonResponse.data.id))
      .then((quizResponse) => setQuiz(quizResponse.data))
      .catch(() => {
        setError("Could not load this quiz.");
        showToast("Couldn't load this quiz right now. Please try again.", "danger");
      });
  }, [pathSlug, lessonSlug]);

  const chooseAnswer = (questionId, selectedKey) => {
    setAnswers((current) => ({ ...current, [questionId]: selectedKey }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await submitQuiz(quiz.id, {
        answers: Object.entries(answers).map(([questionId, selectedKey]) => ({ questionId, selectedKey })),
        timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setResult(response.data);
    } catch (requestError) {
      setError("Could not submit the quiz.");
      showToast("Couldn't submit the quiz right now. Please try again.", "danger");
    }
  };

  return (
    <main className="page-shell">
      <DashboardShell title={quiz?.title || "Quiz"} subtitle="Choose one answer for each question, then submit for your score.">
        {error ? <div className="section-card p-4 mb-4 text-danger">{error}</div> : null}
        {!quiz && !error ? <div className="section-card p-4">Loading quiz...</div> : null}
        {quiz && !result ? (
          <form onSubmit={handleSubmit}>
            {quiz.questions.map((question, index) => (
              <fieldset className="section-card p-4 mb-4" key={question.id}>
                <legend className="h4">{index + 1}. {question.prompt}</legend>
                <div className="d-grid gap-2 mt-3">
                  {question.options.map((option) => (
                    <label className="border rounded-3 p-3" key={option.key}>
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option.key}
                        onChange={() => chooseAnswer(question.id, option.key)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button type="submit" className="btn btn-primary" disabled={!quiz.questions.every((question) => answers[question.id])}>Submit quiz</button>
          </form>
        ) : null}
        {result ? (
          <section className="section-card p-4 p-lg-5">
            <div className="eyebrow mb-2">Quiz result</div>
            <h2 className="display-6 fw-bold">{result.score}%</h2>
            <p className={result.passed ? "text-success" : "text-danger"}>{result.passed ? "Passed" : "Not passed yet"}</p>
            <div className="d-grid gap-3 mt-4">
              {result.explanations?.map((item) => (
                <div className="border rounded-3 p-3" key={item.questionId}>
                  <div className="small muted-copy">Explanation</div>
                  <div>{item.explanation || "Review the lesson and try again."}</div>
                </div>
              ))}
            </div>
            <Link className="btn btn-primary mt-4" href={`/learn/${pathSlug}/${lessonSlug}`}>Back to lesson</Link>
          </section>
        ) : null}
      </DashboardShell>
    </main>
  );
}
