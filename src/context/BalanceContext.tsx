/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface BalanceResponse {
  balance: number;
}

interface BalanceContextType {
  balance: number;
  setBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/api/v1/wallet-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Server response:', text);
        throw new Error(`HTTP error! status: ${response.status}, Response: ${text.substring(0, 50)}...`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // const text = await response.text();
        throw new Error('Invalid response format: Expected JSON, got HTML/text');
      }

      const data: BalanceResponse = await response.json();
      if (!data.balance && data.balance !== 0) throw new Error('Invalid balance data');
      setBalance(data.balance);
    } catch (err: any) {
      setError(err.message || "Failed to fetch wallet balance");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshBalance]);

  return (
    <BalanceContext.Provider value={{ balance, setBalance, refreshBalance, isLoading, error }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}