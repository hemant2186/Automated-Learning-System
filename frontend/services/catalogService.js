import API from "../lib/api";

export async function fetchCatalog(params = {}) {
  const query = {};

  if (params.category) {
    query.category = params.category;
  }

  if (params.difficulty) {
    query.difficulty = params.difficulty;
  }

  if (params.search) {
    query.search = params.search;
  }

  if (params.sort) {
    query.sort = params.sort;
  }

  const response = await API.get("/api/catalog", { params: query });
  return response.data;
}
