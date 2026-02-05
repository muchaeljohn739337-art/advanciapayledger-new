// lib/api/client.ts
// API Client for Frontend-Backend Communication

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

// ===========================================
// API CLIENT CONFIGURATION
// ===========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "v1";
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions
});

// ===========================================
// REQUEST INTERCEPTOR
// ===========================================

apiClient.interceptors.request.use(
  (config) => {
    // Get auth token from localStorage or cookie
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] = generateRequestId();

    // Add timestamp
    config.headers["X-Timestamp"] = new Date().toISOString();

    if (process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true") {
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ===========================================
// RESPONSE INTERCEPTOR
// ===========================================

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true") {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/api/${API_VERSION}/auth/refresh`,
            {
              refreshToken,
            },
          );

          const { token } = response.data;
          setAuthToken(token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        clearAuthTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true") {
      console.error("API Error:", {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  },
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || null;
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token") || null;
}

function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
}

function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export the apiClient instance
export { apiClient };

// ===========================================
// API METHODS
// ===========================================

export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.get<T>(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.delete<T>(url, config);
  },
};

// ===========================================
// TYPED API ENDPOINTS
// ===========================================

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (data: any) => api.post("/auth/register", data),

  logout: () => api.post("/auth/logout"),

  verifyTotp: (code: string) => api.post("/auth/verify-totp", { code }),

  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

export const paymentApi = {
  createPayment: (data: any) => api.post("/payments", data),

  getPayments: (params?: any) => api.get("/payments", { params }),

  getPaymentById: (id: string) => api.get(`/payments/${id}`),

  processCryptoPayment: (data: any) => api.post("/payments/crypto", data),
};

export const facilityApi = {
  getFacilities: () => api.get("/facilities"),

  getFacilityById: (id: string) => api.get(`/facilities/${id}`),

  updateFacility: (id: string, data: any) =>
    api.patch(`/facilities/${id}`, data),
};

export const userApi = {
  getCurrentUser: () => api.get("/users/me"),

  updateProfile: (data: any) => api.patch("/users/me", data),

  enable2FA: () => api.post("/users/me/enable-2fa"),

  disable2FA: () => api.post("/users/me/disable-2fa"),
};

export const walletApi = {
  getWallets: () => api.get("/wallets"),

  createWallet: (blockchain: string) => api.post("/wallets", { blockchain }),

  getWalletBalance: (id: string) => api.get(`/wallets/${id}/balance`),
};

// ===========================================
// CONNECTION TEST
// ===========================================

export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get("/health");
    return response.status === 200;
  } catch (error) {
    console.error("Backend connection failed:", error);
    return false;
  }
};

export default api;
