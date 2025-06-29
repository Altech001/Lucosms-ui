import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Constants for API endpoints
const ENDPOINTS = {
  CONNECT: `${BASE_URL}/api/connect`,
  STATUS: `${BASE_URL}/api/status`,
  SEND_MESSAGE: `${BASE_URL}/api/send-message`,
  QR_CODE: `${BASE_URL}/api/qr-code`
};

// Helper function to handle API errors
const handleApiError = (error, context) => {
  if (axios.isAxiosError(error)) {
    throw new Error(`${context} error: ${error.message}`);
  }
  throw error;
};

export const whatsappService = {
  connect: async () => {
    try {
      const response = await axios.post(ENDPOINTS.CONNECT);
      
      // Ensure we get a proper status response
      if (!response.data?.isConnected) {
        throw new Error('Failed to connect to WhatsApp');
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error, 'Connection');
      return { isConnected: false };
    }
  },

  getStatus: async () => {
    try {
      const response = await axios.get(ENDPOINTS.STATUS);
      
      // Ensure we have a proper status object
      return {
        isConnected: response.data?.isConnected || false,
        qrCode: response.data?.qrCode || null,
        user: response.data?.user || null,
        lastMessage: response.data?.lastMessage || null
      };
    } catch (error) {
      handleApiError(error, 'Status check');
      return { isConnected: false };
    }
  },

  // Format phone number for WhatsApp API
  formatPhoneNumber: (number) => {
    // Clean the number and ensure proper format
    const cleaned = number.trim().replace(/[^+\d]/g, '');
    
    // Add @c.us suffix for WhatsApp API
    return `${cleaned}@c.us`;
  },

  sendMessage: async (to, message) => {
    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    try {
      // Ensure the phone number is properly formatted
      const formattedNumber = to.trim().replace(/[^+\d]/g, '');
      if (!formattedNumber.startsWith('+256')) {
        throw new Error('Phone number must start with +256');
      }

      const response = await axios.post(ENDPOINTS.SEND_MESSAGE, {
        to: `${formattedNumber}@c.us`,
        message
      });
      
      // Ensure we got a proper response
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Message sending failed');
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error, 'Message sending');
      return { success: false, error: error.message };
    }
  },

  getQRCode: async () => {
    try {
      const response = await axios.get(ENDPOINTS.QR_CODE);
      return response.data.qr || null;
    } catch (error) {
      handleApiError(error, 'QR code retrieval');
    }
  }
};
