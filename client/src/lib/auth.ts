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

// ✅ Updated to match your AuthError pattern
export async function updateProfile(data: { name: string }): Promise<AuthUser> {
  const token = localStorage.getItem("nm_token");
  
  if (!token) {
    throw new AuthError("Not authenticated");
  }

  const r = await fetch(`${API_URL}/api/v1/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const body = await r.json().catch(() => ({}));

  if (!r.ok) {
    const message = body?.message || body?.error || "Failed to update profile";
    throw new AuthError(message);
  }

  return body.user as AuthUser;
}

// ✅ Updated to match your AuthError pattern
export async function updatePassword(
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  const token = localStorage.getItem("nm_token");
  
  if (!token) {
    throw new AuthError("Not authenticated");
  }

  const r = await fetch(`${API_URL}/api/v1/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const body = await r.json().catch(() => ({}));

  if (!r.ok) {
    const message = body?.message || body?.error || "Failed to update password";
    const errors = body?.errors; // Password validation errors
    throw new AuthError(message, errors);
  }
}