import { API_URL } from "./api";

export type AuthUser = { _id: string; email: string; name?: string };

// Custom error class that doesn't log to console
class AuthError extends Error {
  response: { data: { message: string; errors?: string[] } };
  
  constructor(message: string, errors?: string[]) {
    super(message);
    this.name = 'AuthError';
    this.response = {
      data: {
        message,
        errors
      }
    };
  }
}

export async function register(email: string, password: string, name?: string) {
  const r = await fetch(`${API_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  
  const body = await r.json().catch(() => ({}));
  
  if (!r.ok) {
    // Extract error details from backend
    const message = body?.message || body?.error || "Register failed";
    const errors = body?.errors; // Array of validation errors
    
    // Throw custom error with details (won't show red in console)
    throw new AuthError(message, errors);
  }
  
  return body as { token: string; user: AuthUser };
}

export async function login(email: string, password: string) {
  const r = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const body = await r.json().catch(() => ({}));
  
  if (!r.ok) {
    const message = body?.message || body?.error || "Login failed";
    throw new AuthError(message);
  }
  
  return body as { token: string; user: AuthUser };
}