import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { Infinity } from "ldrs/react";
import "ldrs/react/Infinity.css";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    // You can replace this with a proper loading component
    return (
      <div className="flex justify-center items-center h-screen">
      
        <Infinity
          size="105"
          stroke="4"
          strokeLength="0.15"
          bgOpacity="0.1"
          speed="1.3"
          color="black"
        />
      </div>
    );
  }

  if (!isSignedIn) {
    // Redirect to signin page but save the attempted url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
