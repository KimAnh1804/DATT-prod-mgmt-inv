"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

// Định nghĩa interface cho User
interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean; // Thêm trạng thái loading
  token: string | null; // Thêm token
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Khởi tạo loading là true
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true); // Bắt đầu kiểm tra, đặt loading là true
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp > currentTime) {
            setIsAuthenticated(true);
            setUser({
              username: payload.username,
              id: payload.userId,
              role: payload.role || "user",
            });

            try {
              const response = await fetch(
                "http://localhost:5000/api/auth/verify",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
              } else {
                console.log(
                  "Server verification failed, token might be invalid or expired on server."
                );
                localStorage.removeItem("token");
                setIsAuthenticated(false);
                setUser(null);
              }
            } catch (error) {
              console.log(
                "Server verification failed, but token is valid client-side:",
                error
              );
              // Nếu server không phản hồi, vẫn giữ trạng thái đăng nhập nếu token client-side hợp lệ
            }
          } else {
            console.log("Token expired client-side.");
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error("Invalid token format:", error);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false); // Kết thúc kiểm tra, đặt loading là false
    };

    checkAuthStatus();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading, // Cung cấp trạng thái loading
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
