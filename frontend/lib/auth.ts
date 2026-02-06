// lib/auth.ts
// Authentication utilities for frontend

import { api } from "./api/client";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role:
    | "SUPER_ADMIN"
    | "FACILITY_ADMIN"
    | "FACILITY_STAFF"
    | "BILLING_MANAGER"
    | "PATIENT"
    | "SUPPORT_AGENT";
  isActive: boolean;
}

// Get current user from token
export async function authenticate(): Promise<User | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await api.get("/auth/me");
    return response.data.user;
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
}

// Get auth token from storage
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

// Set auth token
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
}

// Remove auth token
export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Login function
export async function login(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const response = await api.post("/auth/login", { email, password });
  const { user, accessToken } = response.data;
  setAuthToken(accessToken);
  return { user, token: accessToken };
}

// Logout function
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    removeAuthToken();
  }
}

// Register function
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ message: string }> {
  const response = await api.post("/auth/register", data);
  return response.data;
}
