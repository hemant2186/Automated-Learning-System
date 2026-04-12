"use client";

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// 🔐 Attach token
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 🔁 Refresh token logic
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh_token");

        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refresh}`,
            },
          }
        );

        const newAccess = res.data.access_token;
        localStorage.setItem("access_token", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return API(originalRequest);
      } catch (error) {
        localStorage.clear();
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

// 🎯 API functions
export const getRecommendations = () =>
  API.get("/api/recommendations/path");

export const getAnalysis = () =>
  API.get("/api/recommendations/analyze");

export const getCurrentUser = () =>
  API.get("/api/auth/me");

export const updateCurrentUser = (payload) =>
  API.put("/api/auth/me", payload);

export const createDemoSession = (role = "student") =>
  API.post("/api/auth/demo-session", { role });

export const getProgress = () =>
  API.get("/api/activity/progress");

export const getTimeline = () =>
  API.get("/api/activity/timeline");

export const getLeaderboard = () =>
  API.get("/api/activity/leaderboard");

export const logActivity = (payload) =>
  API.post("/api/activity/ingest", payload);

export const getInstructorAnalytics = () =>
  API.get("/api/instructor/analytics");

export default API;
