"use client";

import { jwtDecode } from "jwt-decode";

import API from "./api";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "learning_path_user";

export function storeAuth(payload) {
  localStorage.setItem(ACCESS_KEY, payload.access_token);
  localStorage.setItem(REFRESH_KEY, payload.refresh_token);
  setStoredUser(payload.user);
  localStorage.setItem("user_id", payload.user.id);
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user?.id) {
    localStorage.setItem("user_id", user.id);
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("user_id");
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function isExpired(token) {
  if (!token) {
    return true;
  }

  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) {
      return false;
    }
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export async function refreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) {
    clearAuth();
    return null;
  }

  const response = await API.post(
    "/api/auth/refresh",
    {},
    {
      headers: { Authorization: `Bearer ${refresh}` },
      skipAuthRefresh: true
    }
  );

  localStorage.setItem(ACCESS_KEY, response.data.access_token);
  return response.data.access_token;
}

export async function ensureAccessToken() {
  const access = localStorage.getItem(ACCESS_KEY);
  if (access && !isExpired(access)) {
    return access;
  }

  try {
    return await refreshToken();
  } catch {
    clearAuth();
    return null;
  }
}
