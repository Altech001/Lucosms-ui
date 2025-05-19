import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { MessageProvider, useMessage } from "../context/MessageContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AlertBanner from "../components/AlertBanner";
import { useEffect, useState } from "react";


const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { state } = useMessage();
  const [actualBalance, setActualBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://luco-sms-api.onrender.com/api/v1/wallet-balance?user_id=1')
      .then(res => res.json())
      .then(data => setActualBalance(data.balance))
      .catch(err => console.error('Error fetching balance:', err));
  }, []);

  console.log('Current balance:', state.balance); // Debug log

  return (
    <div className="min-h-screen xl:flex">
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
        <header>
          <div className="flex items-center justify-end gap-4">
            
            {/* Add any other header elements */}
          </div>
        </header>
        {actualBalance !== null && actualBalance < 100 && (
          <AlertBanner
            type="warning"
            message="Low balance alert! Your balance is less than 100 UGX. Please recharge to continue sending messages."
          />
        )}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
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
