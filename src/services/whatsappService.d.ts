declare module '../services/whatsappService' {
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
    sendMessage(to: string, message: string): Promise<MessageResult>;
    getQRCode(): Promise<{ qr: string | null }>;
  }

  export const whatsappService: WhatsAppService;
}
