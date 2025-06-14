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
              <Route path="/templates" element={<Templates />} />
              <Route path="/compose" element={<ComposeMessages />} />
              <Route path="/billings" element={<Billings />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/tutorials" element={<Tutorials />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </BalanceProvider>
    </QueryClientProvider>
  );
}
