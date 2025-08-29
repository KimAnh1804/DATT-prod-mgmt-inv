"use client";

import type React from "react";
import { useState, useEffect } from "react";

interface Product {
  _id: string;
  name: string;
  sellPrice: number;
  stock: number;
  unit: string;
}

interface OrderItem {
  product: {
    _id: string;
    name: string;
    sellPrice: number;
  };
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

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    items: [{ productId: "", quantity: 1 }],
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

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
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Đơn hàng đã được xóa thành công");
        // Refresh orders list
        fetchOrders();
      } else {
        const data = await response.json();
        alert(data.message || "Có lỗi xảy ra khi xóa đơn hàng");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Có lỗi xảy ra khi xóa đơn hàng");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate form data
      if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin khách hàng!");
        setSaving(false);
        return;
      }

      // Validate items
      const validItems = formData.items.filter(
        (item) => item.productId && item.quantity > 0
      );
      if (validItems.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm!");
        setSaving(false);
        return;
      }

      // Check stock for each item
      for (const item of validItems) {
        const product = products.find((p) => p._id === item.productId);
        if (product && product.stock < item.quantity) {
          alert(
            `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.stock}`
          );
          setSaving(false);
          return;
        }
      }

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
          items: validItems,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        await fetchProducts(); // Refresh products to update stock
        setShowModal(false);
        resetForm();
        alert("Tạo đơn hàng thành công!");
      } else {
        const error = await response.json();
        alert(error.message || "Có lỗi xảy ra khi tạo đơn hàng!");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Có lỗi xảy ra khi tạo đơn hàng!");
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchOrders();
        alert("Cập nhật trạng thái thành công!");
      } else {
        alert("Có lỗi xảy ra khi cập nhật trạng thái!");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      items: [{ productId: "", quantity: 1 }],
    });
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1 }],
    });
  };

  const removeOrderItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700">
            Chờ xử lý
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700">
            Hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-700">
            {status}
          </span>
        );
    }
  };

  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-6">
          Quản lý đơn hàng
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Tạo đơn hàng
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.totalAmount.toLocaleString("vi-VN")} VNĐ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewOrderDetail(order)}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-600 font-medium rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Chi tiết
                    </button>
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            updateOrderStatus(order._id, "completed")
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 text-green-600 font-medium rounded-md hover:bg-green-50 hover:border-green-400 transition-colors duration-200"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Hoàn thành
                        </button>
                        <button
                          onClick={() =>
                            updateOrderStatus(order._id, "cancelled")
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-yellow-600 font-medium rounded-md hover:bg-yellow-50 hover:border-yellow-400 transition-colors duration-200"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
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
                          Hủy
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-600 font-medium rounded-md hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tạo đơn hàng mới
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Tên khách hàng *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Sản phẩm
                  </label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-center">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateOrderItem(index, "productId", e.target.value)
                          }
                          className="form-input"
                          required
                        >
                          <option value="">Chọn sản phẩm</option>
                          {products
                            .filter((p) => p.stock > 0)
                            .map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} -{" "}
                                {product.sellPrice.toLocaleString("vi-VN")} VNĐ
                                (Còn: {product.stock})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="form-input"
                          min="1"
                          max={
                            products.find((p) => p._id === item.productId)
                              ?.stock || 999
                          }
                          required
                        />
                      </div>
                      <div className="w-32 text-sm text-gray-600">
                        {item.productId && (
                          <span>
                            {(
                              (products.find((p) => p._id === item.productId)
                                ?.sellPrice || 0) * item.quantity
                            ).toLocaleString("vi-VN")}{" "}
                            VNĐ
                          </span>
                        )}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="btn-danger px-2 py-1 text-sm"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="btn-secondary text-sm mt-2"
                  >
                    + Thêm sản phẩm
                  </button>

                  {/* Tổng tiền */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tổng tiền:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formData.items
                          .reduce((total, item) => {
                            const product = products.find(
                              (p) => p._id === item.productId
                            );
                            return (
                              total +
                              (product ? product.sellPrice * item.quantity : 0)
                            );
                          }, 0)
                          .toLocaleString("vi-VN")}{" "}
                        VNĐ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Đang tạo..." : "Tạo đơn hàng"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết đơn hàng
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p>
                    <strong>Mã đơn hàng:</strong> {selectedOrder.orderNumber}
                  </p>
                  <p>
                    <strong>Khách hàng:</strong> {selectedOrder.customerName}
                  </p>
                  <p>
                    <strong>Số điện thoại:</strong>{" "}
                    {selectedOrder.customerPhone}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Ngày tạo:</strong>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    {getStatusBadge(selectedOrder.status)}
                  </p>
                  <p>
                    <strong>Tổng tiền:</strong>{" "}
                    {selectedOrder.totalAmount.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Danh sách sản phẩm:</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.price.toLocaleString("vi-VN")} VNĐ
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {(item.quantity * item.price).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
