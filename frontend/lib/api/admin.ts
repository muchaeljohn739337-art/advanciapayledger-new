import { apiClient } from "./apiClient";

export const adminApi = {
  getAllUsers: async (token: string) => {
    return apiClient.get("/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createUser: async (userData: any, token: string) => {
    return apiClient.post("/admin/users", userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateUser: async (userId: string, userData: any, token: string) => {
    return apiClient.put(`/admin/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  deleteUser: async (userId: string, token: string) => {
    return apiClient.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  executeTransfer: async (transferData: any, token: string) => {
    return apiClient.post("/admin/wallet/transfer", transferData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getWalletDetails: async (token: string) => {
    return apiClient.get("/admin/wallet/details", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getTransferHistory: async (token: string) => {
    return apiClient.get("/admin/wallet/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  notifyAccountant: async (transferData: any, token: string) => {
    return apiClient.post("/admin/wallet/notify-accountant", transferData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
