export interface Status {
  isConnected: boolean;
  qrCode: string | null;
  qrCodeDataUrl: string | null;
  user: { name: string } | null;
  lastMessage: {
    to: string;
    text: string;
    timestamp: string;
  } | null;
}

export interface MessageResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface WhatsAppService {
  connect(): Promise<Status>;
  getStatus(): Promise<Status>;
  sendMessage(): Promise<MessageResult>;
  getQRCode(): Promise<{ qr: string | null }>;
  disconnect(): Promise<void>;
  setRecipient(number: string): void;
  setMessage(message: string): void;
}

export const whatsappService: WhatsAppService = {
  connect: (): Promise<Status> => {
    throw new Error('Not implemented');
  },
  getStatus: (): Promise<Status> => {
    throw new Error('Not implemented');
  },
  sendMessage: (): Promise<MessageResult> => {
    throw new Error('Not implemented');
  },
  getQRCode: (): Promise<{ qr: string | null }> => {
    throw new Error('Not implemented');
  },
  disconnect: (): Promise<void> => {
    throw new Error('Not implemented');
  },
  setRecipient: (number: string): void => {
    Object.defineProperty(whatsappService, 'recipient', {
      value: number,
      writable: true,
      configurable: true
    });
  },
  setMessage: (message: string): void => {
    Object.defineProperty(whatsappService, 'message', {
      value: message,
      writable: true,
      configurable: true
    });
  }
};
