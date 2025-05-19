/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ApiKeyResponse {
    api_key: string;
    message: string;
  }
  
  export interface ApiKey {
    id: number;
    key: string;
    is_active: boolean;
  }
  
  // Add ApiLog interface
  export interface ApiLog {
    method: string;
    endpoint: string;
    status: number;
    time: string;
    key: string;
  }
  
  // API configuration
  export const API_CONFIG = {
    BASE_URL: 'https://luco-sms-api.onrender.com',
    VERSION: '/api/v1',
    USER_ID: 1
  };
  
  const API_BASE_URL = API_CONFIG.BASE_URL;
  
  export const apiService = {
    async generateApiKey(userId: number): Promise<ApiKeyResponse> {
      const response = await fetch(`${API_BASE_URL}/api_key/generate?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
      });
      return response.json();
    },
  
    async listApiKeys(userId: number): Promise<ApiKey[]> {
      const response = await fetch(`${API_BASE_URL}/api_key/list?user_id=${userId}`, {
        headers: {
          'accept': 'application/json',
        },
      });
      return response.json();
    },
  
    async deactivateApiKey(userId: number, keyId: number): Promise<{ message: string }> {
      const response = await fetch(`${API_BASE_URL}/api_key/deactivate/${keyId}?user_id=${userId}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
        },
      });
      return response.json();
    },
  
    async deleteApiKey(userId: number, keyId: number): Promise<{ message: string }> {
      const response = await fetch(`${API_BASE_URL}/api_key/delete/${keyId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
        },
      });
      return response.json();
    },
  
    async getApiLogs(_userId: number): Promise<ApiLog[]> {
      // Simulated API response for now
      return [
        {
          method: 'POST',
          endpoint: '/api/v1/sms/send',
          status: 200,
          time: new Date().toISOString(),
          key: 'luco_api_97456'
        },
        {
          method: 'GET',
          endpoint: '/api/v1/contacts',
          status: 200,
          time: new Date(Date.now() - 3600000).toISOString(),
          key: 'luco_api_30256'
        },
        {
          method: 'POST',
          endpoint: '/api/v1/contacts/import',
          status: 400,
          time: new Date(Date.now() - 7200000).toISOString(),
          key: 'luco_api_789012'
        }
      ];
    }
  };