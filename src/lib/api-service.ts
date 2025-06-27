// import { useAuth } from "@clerk/clerk-react";

export interface ApiKeyResponse {
  api_key: string;
  message: string;
}

export interface ApiKey {
  id: number;
  key: string; // Masked key (last 8 chars)
  full_key: string; // Full key for copying
  is_active: boolean;
}

export interface ApiLog {
  method: string;
  endpoint: string;
  status: number;
  time: string;
  key: string;
}

// const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

export interface SMSHistory {
  id: number;
  recipient: string;
  message: string;
  status: string;
  cost: number;
  created_at: string;
}

export const apiService = {
  async generateApiKey(getToken: () => Promise<string | null>): Promise<ApiKeyResponse> {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api_key/generate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to generate API key: ${response.statusText}`);
    }

    return response.json();
  },

  async listApiKeys(getToken: () => Promise<string | null>): Promise<ApiKey[]> {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api_key/list`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch API keys: ${response.statusText}`);
    }

    return response.json();
  },

  async deactivateApiKey(keyId: number, getToken: () => Promise<string | null>) {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api_key/deactivate/${keyId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to deactivate API key: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteApiKey(keyId: number, getToken: () => Promise<string | null>) {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api_key/delete/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete API key: ${response.statusText}`);
    }

    return response.json();
  },

  async getTransactionHistory(getToken: () => Promise<string | null>, userId: string): Promise<Transaction[]> {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/user/api/v1/transaction_history?user_id=${userId}&skip=0&limit=10`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error('Failed to fetch transaction history');
    return response.json();
  },

  async getSmsHistory(getToken: () => Promise<string | null>): Promise<SMSHistory[]> {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/user/api/v1/sms_history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error('Failed to fetch SMS history');
    return response.json();
  }
};