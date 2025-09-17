"use client";

import type React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import logo from "../assets/ivn-logo.svg.png";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Ensure scrolling works properly
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/", label: "Dashboard" },
    { path: "/products", label: "Sản phẩm" },
    { path: "/orders", label: "Đơn hàng" },
    { path: "/inventory", label: "Nhập/Xuất kho" },
    { path: "/reports", label: "Báo cáo" },
  ];

  return (
    <div className="min-h-screen bg-blue-50/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-500 border-b border-gray-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo + title */}
            <div className="flex items-center space-x-3">
              <img src={logo} alt="IVN Logo" className="h-12 w-auto" />
              <h1 className="text-2xl font-semibold text-white">
                Initation Việt Nam - Quản lý sản phẩm & đơn hàng
              </h1>
            </div>

            {/* Logout */}
            <div className="relative">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 text-white hover:text-red-100 transition-all duration-200 focus:outline-none py-3 px-5 rounded-lg hover:bg-red-500/20 hover:scale-105"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-base font-semibold">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer cho header */}
      <div className="h-[73px]"></div>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-blue-100 fixed top-[73px] left-0 bottom-0 overflow-y-auto">
          <div className="py-6">
            <div className="px-4 mb-6">
              <h2 className="text-xl font-bold text-blue-900 tracking-wide">
                Menu
              </h2>
            </div>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path} className="px-3">
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 font-semibold ${
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 ml-64 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
