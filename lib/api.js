import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("merl_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("merl_token", token);
  else localStorage.removeItem("merl_token");
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("merl_token");
}

export function setUser(user) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem("merl_user", JSON.stringify(user));
  else localStorage.removeItem("merl_user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("merl_user") || "null");
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  setToken(data.token);
  setUser(data.data.user);
  return data;
}

export async function signup(payload) {
  const { data } = await api.post("/auth/signup", payload);
  setToken(data.token);
  setUser(data.data.user);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  setUser(data.data.user);
  return data.data.user;
}

export function logout() {
  setToken(null);
  setUser(null);
}
