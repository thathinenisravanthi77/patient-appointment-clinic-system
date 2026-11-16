
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Profile, UserRole } from "@/lib/supabase";
import { apiRequest } from "@/services/api";

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (
  email: string,
  password: string,
  role?: UserRole
) => Promise<{ error: string | null }>;
  signUp: (data: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isPatient: boolean;
  isDoctor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatProfile(user: any): Profile {
  return {
    id: String(user.userId ?? user.user_id),
    full_name: user.fullName ?? user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // CHECK EXISTING LOGIN WHEN THE APP OPENS
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const token = localStorage.getItem("clinic_token");

      if (!token) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await apiRequest("/auth/me");

        if (mounted) {
          setProfile(formatProfile(response.user));
        }
      } catch (error) {
        console.error("Authentication error:", error);
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // LOGIN
  
// LOGIN
const signIn = async (
  email: string,
  password: string,
  role?: UserRole
) => {
  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(role ? { role } : {}),
      }),
    });

    localStorage.setItem("clinic_token", response.token);

    setProfile(formatProfile(response.user));

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
};


  // PATIENT REGISTRATION
  
const signUp = async (data: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}) => {
  if (data.role !== "patient") {
    return {
      error: "Doctor accounts must be created by the clinic administrator.",
    };
  }

  try {
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }),
    });

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Registration failed",
    };
  }
};


  // LOGOUT
  const signOut = async () => {
    localStorage.removeItem("clinic_token");
    setProfile(null);
  };

  const value: AuthContextType = {
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isPatient: profile?.role === "patient",
    isDoctor: profile?.role === "doctor",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
