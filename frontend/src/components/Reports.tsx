"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyStat {
  month: string;
  orders: number;
  revenue: number;
}

interface DailyStat {
  date: string;
  orders: number;
  revenue: number;
}

interface ProductItem {
  name: string;
  unit?: string;
  code?: string;
}

interface OrderItem {
  product: ProductItem;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  totalExpense: number;
  profit: number;
  topProducts: Array<{
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  monthlyStats: MonthlyStat[];
  dailyStats: DailyStat[];
  inventoryStats: {
    import: { totalTransactions: number; totalQuantity: number };
    export: { totalTransactions: number; totalQuantity: number };
  };
  lowStockProducts: Array<{
    name: string;
    stock: number;
    unit: string;
    lowStockThreshold: number;
  }>;
  period: { startDate: string; endDate: string } | null;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalExpense: 0,
    profit: 0,
    topProducts: [],
    monthlyStats: [],
    dailyStats: [],
    inventoryStats: {
      import: { totalTransactions: 0, totalQuantity: 0 },
      export: { totalTransactions: 0, totalQuantity: 0 },
    },
    lowStockProducts: [],
    period: null,
  });

  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [showDetailList, setShowDetailList] = useState(false);
  const [detailOrders, setDetailOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/reports";

      if (filters?.startDate && filters?.endDate) {
        url += `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ReportData = await response.json();
        setReportData(data);

        const ordersResponse = await fetch(
          `http://localhost:5000/api/orders${
            filters?.startDate && filters?.endDate
              ? `?startDate=${filters.startDate}&endDate=${filters.endDate}`
              : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (ordersResponse.ok) {
          const ordersData: Order[] = await ordersResponse.json();
          setDetailOrders(ordersData);
        } else {
          console.error(
            "Failed to fetch detailed orders:",
            ordersResponse.statusText
          );
          setDetailOrders([]);
        }
      } else {
        console.error("Failed to fetch report data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setDetailOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateFilter.startDate && dateFilter.endDate) {
      setLoading(true);
      setShowDetailList(true);
      fetchReportData(dateFilter);
    } else {
      alert("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!");
    }
  };

  const clearFilter = () => {
    setDateFilter({ startDate: "", endDate: "" });
    setLoading(true);
    setShowDetailList(false);
    fetchReportData();
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/reports/export";

      if (dateFilter.startDate && dateFilter.endDate) {
        url += `?startDate=${dateFilter.startDate}&endDate=${dateFilter.endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = `bao-cao-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        alert(`Lỗi khi xuất báo cáo: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Có lỗi xảy ra khi xuất báo cáo Excel.");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-500 mb-6">
          Báo cáo thống kê
        </h1>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
        >
          📊 Xuất Excel
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Bộ lọc thời gian
        </h2>
        <form onSubmit={handleFilterSubmit} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
          >
            Lọc
          </button>
          <button
            type="button"
            onClick={clearFilter}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Xóa bộ lọc
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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
                  {reportData.totalOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
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
                  {reportData.totalRevenue.toLocaleString("vi-VN")} VNĐ
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  Doanh thu TB/đơn
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {reportData.totalOrders > 0
                    ? Math.round(
                        reportData.totalRevenue / reportData.totalOrders
                      ).toLocaleString("vi-VN")
                    : 0}{" "}
                  VNĐ
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">
                  SP bán chạy nhất
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {reportData.topProducts[0]?.totalSold || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Sản phẩm bán chạy
          </h2>
          <div className="space-y-4">
            {reportData.topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transform transition-all duration-200 hover:scale-102 hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Đã bán: {product.totalSold} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {product.revenue.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Thống kê theo tháng
          </h2>
          <div className="space-y-4">
            {reportData.monthlyStats.map((stat: MonthlyStat, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transform transition-all duration-200 hover:scale-102 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Tháng {stat.month}
                  </p>
                  <p className="text-sm text-gray-600">
                    {stat.orders} đơn hàng
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">
                    {stat.revenue.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Orders List */}
      {showDetailList && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Danh sách đơn hàng chi tiết
              {dateFilter.startDate && dateFilter.endDate && (
                <span className="text-sm text-gray-600 ml-2">
                  (Từ{" "}
                  {new Date(dateFilter.startDate).toLocaleDateString("vi-VN")}{" "}
                  đến {new Date(dateFilter.endDate).toLocaleDateString("vi-VN")}
                  )
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowDetailList(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {detailOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Không có đơn hàng nào trong khoảng thời gian này
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customerPhone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items?.map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.product?.name} x{item.quantity}
                          </div>
                        )) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {order.totalAmount.toLocaleString("vi-VN")} VNĐ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Hoàn thành"
                            : order.status === "cancelled"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
