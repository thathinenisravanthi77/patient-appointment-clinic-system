import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "patient" | "doctor" | "any";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: Role;
}

export function ProtectedRoute({ children, role = "any" }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-[spin_1s_linear_infinite]" />
          <p className="text-sm text-gray-500">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === "patient" && profile.role !== "patient") {
    return <Navigate to="/login" replace />;
  }

  if (role === "doctor" && profile.role !== "doctor") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
