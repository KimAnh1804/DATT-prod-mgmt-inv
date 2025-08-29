"use client";

import type React from "react";
import { useState, useEffect } from "react";

interface Product {
  _id: string;
  name: string;
  unit: string;
  stock: number;
}

interface Transaction {
  _id: string;
  product: {
    _id: string;
    name: string;
    unit: string;
  } | null;
  type: "import" | "export";
  quantity: number;
  note: string;
  createdAt: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: 1,
    note: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (data.length > 0 && !formData.productId) {
          setFormData((prev) => ({ ...prev, productId: data[0]._id }));
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/inventory/transactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/inventory/transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            type: activeTab,
          }),
        }
      );

      if (response.ok) {
        await fetchTransactions();
        await fetchProducts();
        resetForm();
        alert(`${activeTab === "import" ? "Nhập" : "Xuất"} kho thành công!`);
      } else {
        const error = await response.json();
        alert(error.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Có lỗi xảy ra!");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: products.length > 0 ? products[0]._id : "",
      quantity: 1,
      note: "",
    });
  };

  const getSelectedProduct = () => {
    return products.find((p) => p._id === formData.productId);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  const selectedProduct = getSelectedProduct();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-500 mb-6">
        Quản lý nhập/xuất kho
      </h1>

      {/* Tabs */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors duration-200 ${
              activeTab === "import"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📥 Nhập kho
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors duration-200 ${
              activeTab === "export"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📤 Xuất kho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {activeTab === "import"
              ? "Tạo phiếu nhập kho"
              : "Tạo phiếu xuất kho"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Sản phẩm *
              </label>
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((product) =>
                  product ? (
                    <option key={product._id} value={product._id}>
                      {product.name} - Tồn kho: {product.stock} {product.unit}
                    </option>
                  ) : null
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng {activeTab === "import" ? "nhập" : "xuất"} *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
                min="1"
                max={
                  activeTab === "export" ? selectedProduct?.stock : undefined
                }
                required
              />
              {activeTab === "export" && selectedProduct && (
                <p className="mt-2 text-sm text-gray-600">
                  Tồn kho hiện tại: {selectedProduct.stock}{" "}
                  {selectedProduct.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
                rows={3}
                placeholder="Nhập ghi chú (tùy chọn)"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-105 ${
                activeTab === "import"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              } disabled:opacity-50`}
              disabled={saving || !formData.productId}
            >
              {saving
                ? "Đang xử lý..."
                : activeTab === "import"
                ? "Tạo phiếu nhập"
                : "Tạo phiếu xuất"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Lịch sử giao dịch
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có giao dịch nào
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className={`p-4 rounded-lg border-l-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                    transaction.type === "import"
                      ? "border-green-500 bg-green-50 hover:bg-green-100"
                      : "border-blue-500 bg-blue-50 hover:bg-blue-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {transaction.type === "import"
                          ? "📥 Nhập kho"
                          : "📤 Xuất kho"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {transaction.product ? (
                          <>
                            {transaction.product.name} - {transaction.quantity}{" "}
                            {transaction.product.unit}
                          </>
                        ) : (
                          <span className="text-red-500">
                            Sản phẩm đã xóa - Số lượng: {transaction.quantity}
                          </span>
                        )}
                      </p>
                      {transaction.note && (
                        <p className="text-sm text-gray-500 mt-1">
                          Ghi chú: {transaction.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-500 mb-4">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {products.length}
            </p>
            <p className="text-sm text-gray-600">Tổng số sản phẩm</p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-green-100 text-green-500 mb-4">
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
                  d="M5 11l7-7 7 7M5 19l7-7 7 7"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {transactions.filter((t) => t.type === "import").length}
            </p>
            <p className="text-sm text-gray-600">Lần nhập kho</p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 transform transition-all duration-200 hover:scale-105">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-500 mb-4">
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
                  d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {transactions.filter((t) => t.type === "export").length}
            </p>
            <p className="text-sm text-gray-600">Lần xuất kho</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
