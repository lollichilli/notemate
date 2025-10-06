import { API_URL } from "./api";

export type AuthUser = { _id: string; email: string; name?: string };

export async function register(email: string, password: string, name?: string) {
  const r = await fetch(`${API_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error || "Register failed");
  return body as { token: string; user: AuthUser };
}

export async function login(email: string, password: string) {
  const r = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error || "Login failed");
  return body as { token: string; user: AuthUser };
}