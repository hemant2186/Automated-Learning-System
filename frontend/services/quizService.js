import API from "../lib/api";

export async function fetchQuiz(lessonSlug) {
  const response = await API.get(`/api/quizzes/${lessonSlug}`);
  return response.data;
}

export async function submitQuiz(lessonSlug, answers) {
  const response = await API.post(`/api/quizzes/${lessonSlug}/submit`, { answers });
  return response.data;
}

export async function fetchQuizResults(lessonSlug) {
  const response = await API.get(`/api/quizzes/${lessonSlug}/results`);
  return response.data;
}
