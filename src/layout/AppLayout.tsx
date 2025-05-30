/* eslint-disable @typescript-eslint/no-explicit-any */
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { MessageProvider } from "../context/MessageContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AlertBanner from "../components/AlertBanner";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  // const { state } = useMessage();
  const { getToken } = useAuth();
  const [actualBalance, setActualBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchBalance = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token not found");

        const response = await fetch(`http://127.0.0.1:8000/user/api/v1/wallet-balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const text = await response.text(); // Log the raw response
          // console.error('Server response:', text);
          throw new Error(`HTTP error! status: ${response.status}, Response: ${text.substring(0, 50)}...`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // const text = await response.text();
          throw new Error('Invalid response format: Expected JSON, got HTML/text');
        }

        const data = await response.json();
        if (!data.balance && data.balance !== 0) throw new Error('Invalid balance data');
        setActualBalance(data.balance);
      } catch (err: any) {
        setError(err.message || 'Error fetching balance');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, [getToken]);

  // console.log('Current balance:', state.balance); // Debug log

  return (
    <div className="min-h-screen xl:flex bg-gradient-to-br from-white via-gray-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <header className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 max-w-[1200px] mx-auto">
            {isLoading ? (
              <div className="animate-pulse h-6 w-24 bg-gray-200 dark:bg-zinc-700 rounded" />
            ) : error ? (
              <span className="text-sm text-red-600 dark:text-red-400 font-[Outfit]">
                {error}
              </span>
            ) : (
              <span className="text-sm font-medium text-zinc-900 dark:text-white font-[Outfit]">
                Balance: UGx {actualBalance?.toFixed(2) || "0.00"}
              </span>
            )}
            {/* Add other header elements here */}
          </div>
        </header>
        {showAlert && actualBalance !== null && actualBalance < 1000 && (
          <AlertBanner
            type="warning"
            message="Low balance alert! Your balance is less than 100 UGX. Please recharge to continue sending messages."
            // onClose={() => setShowAlert(false)}
          />
        )}
        <div className="p-4 mx-auto max-w-[1200px] md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <MessageProvider>
        <LayoutContent />
      </MessageProvider>
    </SidebarProvider>
  );
};

export default AppLayout;