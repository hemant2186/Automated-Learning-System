import API from '../lib/api';

export async function fetchLessonBySlug(lessonSlug) {
  const response = await API.get(`/api/lessons/${lessonSlug}`);
  return response.data;
}
