import API from "../lib/api";

export async function fetchUserPaths() {
  const response = await API.get("/api/progress");
  return response.data;
}

export async function fetchPathEnrollment(pathSlug) {
  const response = await API.get(`/api/progress/${pathSlug}`);
  return response.data;
}

export async function enrollInPath(pathSlug) {
  const response = await API.post(`/api/progress/${pathSlug}/enroll`);
  return response.data;
}

export async function completeLesson(lessonSlug) {
  const response = await API.post(`/api/progress/lessons/${lessonSlug}/complete`);
  return response.data;
}
