import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "../schemas";

const BASE_URL = process.env.BASE_URL;

interface AuthContextType {
  user: User | null;
  login: (user: User, auth: string) => void;
  logout: () => void;
  auth: string;
  toggleTheme: () => void;
  theme: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<string | null>(localStorage.getItem("auth"));
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("FintrackTheme") ?? "dark"
  );

  const login = (user: User, auth: string) => {
    console.log({ user, auth });

    setUser(user);
    setAuth(auth);
    localStorage.setItem("auth", auth);
  };

  const logout = () => {
    setUser(null);
    setAuth("");
    localStorage.removeItem("auth");
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (auth) {
        try {
          const response = await fetch(`${BASE_URL}/auth/auth`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${auth}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Fetch failed with status ${response.status}`);
          }

          const data = await response.json();
          const { user } = data.results;
          setUser(user);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };

    fetchUser();
  }, [auth]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("FintrackTheme", newTheme);
  };

  useEffect(() => {
    if (theme) return;
    localStorage.setItem("FintrackTheme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, auth: auth || "", toggleTheme, theme }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
