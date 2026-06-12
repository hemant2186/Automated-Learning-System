import API from "../lib/api";

export async function fetchLearningPaths() {
  const response = await API.get("/api/paths");
  return response.data;
}

export async function fetchLearningPathBySlug(slug) {
  const response = await API.get(`/api/paths/${slug}`);
  return response.data;
}
