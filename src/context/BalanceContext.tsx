import React, { createContext, useContext, useState, useEffect } from 'react';

interface BalanceContextType {
  balance: number;
  setBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://luco-sms-api.onrender.com/api/v1/wallet-balance?user_id=1');
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, setBalance, refreshBalance, isLoading }}>
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