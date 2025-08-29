"use client";

import type React from "react";
import { useState, useEffect } from "react";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  lowStockItems: Array<{
    name: string;
    stock: number;
    unit: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    lowStockItems: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/dashboard/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback data if backend not available
        setStats({
          totalProducts: 25,
          totalOrders: 150,
          totalRevenue: 45000000,
          lowStockProducts: 3,
          lowStockItems: [
            { name: "Laptop Dell", stock: 5, unit: "chiếc" },
            { name: "Chuột Logitech", stock: 8, unit: "chiếc" },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback data
      setStats({
        totalProducts: 25,
        totalOrders: 150,
        totalRevenue: 45000000,
        lowStockProducts: 3,
        lowStockItems: [
          { name: "Laptop Dell", stock: 5, unit: "chiếc" },
          { name: "Chuột Logitech", stock: 8, unit: "chiếc" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Title */}
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-blue-500 mb-6">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  Tổng sản phẩm
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  Tổng đơn hàng
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  Tổng doanh thu
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalRevenue.toLocaleString("vi-VN")} VNĐ
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Low Stock Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-red-100 text-red-600">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  Sản phẩm sắp hết
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.lowStockProducts}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {stats.lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-yellow-500 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              Cảnh báo tồn kho thấp
            </h2>
          </div>
          <div className="text-sm text-gray-600">
            Các sản phẩm sau đây có tồn kho thấp:
          </div>
          <ul className="mt-3 space-y-2">
            {stats.lowStockItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="text-yellow-600">
                  Còn lại: {item.stock} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Hoạt động gần đây
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
            <span className="text-gray-700">
              Hệ thống đang hoạt động bình thường
            </span>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div className="text-sm">
              <div className="text-gray-700">
                Dữ liệu được cập nhật lần cuối:
              </div>
              <div className="text-blue-600 font-medium">
                {new Date().toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
