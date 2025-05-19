export interface ApiKeyResponse {
  api_key: string;
  message: string;
}

export interface ApiKey {
  id: number;
  key: string;
  is_active: boolean;
}

export interface ApiLog {
  method: string;
  endpoint: string;
  status: number;
  time: string;
  key: string;
}

const API_BASE_URL = 'https://luco-sms-api.onrender.com';

export const apiService = {
  async generateApiKey(userId: number): Promise<ApiKeyResponse> {
    const response = await fetch(`${API_BASE_URL}/api_key/generate?user_id=${userId}`, {
      method: 'POST',
      headers: { 'accept': 'application/json' },
    });
    return response.json();
  },

  async listApiKeys(userId: number): Promise<ApiKey[]> {
    const response = await fetch(`${API_BASE_URL}/api_key/list?user_id=${userId}`, {
      headers: { 'accept': 'application/json' },
    });
    return response.json();
  },

  async deactivateApiKey(userId: number, keyId: number) {
    const response = await fetch(`${API_BASE_URL}/api_key/deactivate/${keyId}?user_id=${userId}`, {
      method: 'PUT',
      headers: { 'accept': 'application/json' },
    });
    return response.json();
  },

  async deleteApiKey(userId: number, keyId: number) {
    const response = await fetch(`${API_BASE_URL}/api_key/delete/${keyId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: { 'accept': 'application/json' },
    });
    return response.json();
  },
};
