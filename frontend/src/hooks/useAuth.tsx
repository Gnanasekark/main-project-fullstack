import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type AppRole = "admin" | "teacher" | "student";

interface Profile {
  id: string;
  full_name?: string;
  mobile_number?: string;
  reg_no?: string;
  degree?: string;
  branch?: string;
  year?: string;
  section?: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: Partial<Profile>,
    role: AppRole
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* 🔑 CHECK SESSION ON PAGE LOAD */
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          setUser(null);
          setProfile(null);
          setRole(null);
        } else {
          const data = await res.json();
          setUser(data.user);
          setProfile(data.profile);
          setRole(data.role);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  /* REGISTER */
  const signUp = async (
    email: string,
    password: string,
    userData: Partial<Profile>,
    role: AppRole
  ) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userData, role }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { error: new Error(err.message || "Signup failed") };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /* LOGIN */
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      if (!res.ok) {
        const err = await res.json();
        return { error: new Error(err.message || "Login failed") };
      }
  
      const data = await res.json();
  
      // Store token
      localStorage.setItem("token", data.token);
  
      // Set basic user immediately
      setUser(data.user);
      setRole(data.user.role);
  
      // 🔥 IMPORTANT: Immediately fetch full profile
      await refreshProfile();
  
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };
  

  /* LOGOUT */
  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  /* REFRESH */
  const refreshProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setRole(data.role);
      }
    } catch (err) {
      console.error("Refresh profile failed", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
