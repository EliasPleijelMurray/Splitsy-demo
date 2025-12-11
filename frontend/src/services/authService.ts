const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  },

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Registration failed");
    }

    const result = await response.json();
    return result.user;
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  },
};
