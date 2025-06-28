import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./utils/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Billings from "./pages/Billings";
import Templates from "./pages/Templates";
import ComposeMessages from "./pages/Compose/ComposeMessage";
import { BalanceProvider } from "./context/BalanceContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Developer from "./pages/Developer/Developer";
import Docs from "./pages/Developer/Docs";
import { AuthGuard } from "./components/Auth/AuthGuard";
import SignIn from "./pages/AuthPages/SignIn";
import Schedules from "./pages/Schedules/Schedules";
import Tutorials from "./pages/Tutorials/Tutorials";
import Topup from "./pages/Home/Topup";
import Backup from "./pages/Home/Backup";
import Restore from "./pages/Home/Restore";
import Pairing from "./pages/Whatsapp/Pairing";
import Sendbulk from "./pages/Whatsapp/Sendbulk";
import LucoflowPage from "./pages/Lucoflow/Lucoflow";
import Stimulator from "./pages/Developer/Stimulator";
import Sponsor from "./pages/Sponsor";

// import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

// import Promo from "./pages/PromoCodes/Promo";

const queryClient = new QueryClient();

// Import your Publishable Key

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BalanceProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected Routes */}
            <Route element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }>
              <Route index path="/" element={<Home />} />
              <Route path="/topup" element={<Topup />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/wchat" element={<Pairing />} />
              <Route path="/wchat/sendbulk" element={<Sendbulk />} />
              <Route path="/compose" element={<ComposeMessages />} />
              <Route path="/billings" element={<Billings />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/backup" element={<Backup />} />
              <Route path="/restore" element={<Restore />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/stimulator" element={<Stimulator/>} />
              <Route path="/tutorials" element={<Tutorials />} />
                            <Route path="/lucoflow" element={<LucoflowPage />} />
              <Route path="/sponsor" element={<Sponsor />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </BalanceProvider>
    </QueryClientProvider>
  );
}
