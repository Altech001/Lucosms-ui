import * as React from 'react';

export interface CachedMessage {
  timestamp: number;
  data: unknown;
}

export interface MessageState {
  cache: Map<string, CachedMessage>;
  balance: number; // Added balance property
}

export interface MessageContextType {
  state: MessageState;
  updateCache: (key: string, data: unknown) => void;
}

const MessageContext = React.createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<MessageState>({ 
    cache: new Map(),
    balance: 0  // Initialize balance
  });

  const updateCache = (key: string, data: unknown) => {
    setState((prev) => ({
      ...prev,
      cache: new Map(prev.cache).set(key, { timestamp: Date.now(), data }),
    }));
  };

  return (
    <MessageContext.Provider value={{ state, updateCache }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};