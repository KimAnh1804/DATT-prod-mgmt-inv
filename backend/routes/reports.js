const express = require("express")
const Order = require("../models/Order")
const Product = require("../models/Product")
const InventoryTransaction = require("../models/InventoryTransaction")
const auth = require("../middleware/auth")
const ExcelJS = require("exceljs")
const router = express.Router()

// Get report data
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    }

    // Total orders and revenue
    const orders = await Order.find(dateFilter)
    const completedOrders = orders.filter((order) => order.status === "completed")
    const totalOrders = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Top products
    const topProductsResult = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } }, 
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          totalSold: 1,
          revenue: 1,
        },
      },
    ])

    // Monthly stats
    const monthlyStats = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      {
        $project: {
          month: {
            $concat: [{ $toString: "$_id.month" }, "/", { $toString: "$_id.year" }],
          },
          orders: 1,
          revenue: 1,
        },
      },
    ])

    // Daily stats for the filtered period
    let dailyStats = []
    if (startDate && endDate) {
      dailyStats = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        {
          $project: {
            date: {
              $concat: [{ $toString: "$_id.day" }, "/", { $toString: "$_id.month" }, "/", { $toString: "$_id.year" }],
            },
            orders: 1,
            revenue: 1,
          },
        },
      ])
    }

    // Inventory stats
    const inventoryStats = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ])

    const importStats = inventoryStats.find((stat) => stat._id === "import") || {
      totalTransactions: 0,
      totalQuantity: 0,
    }
    const exportStats = inventoryStats.find((stat) => stat._id === "export") || {
      totalTransactions: 0,
      totalQuantity: 0,
    }

    // Low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).select("name stock unit lowStockThreshold")

    res.json({
      totalOrders,
      totalRevenue,
      topProducts: topProductsResult,
      monthlyStats,
      dailyStats,
      inventoryStats: {
        import: importStats,
        export: exportStats,
      },
      lowStockProducts,
      period: startDate && endDate ? { startDate, endDate } : null,
    })
  } catch (error) {
    console.error("Get report data error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu báo cáo" })
  }
})

// Export Excel report
router.get("/export", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    }

    // Get data
    const orders = await Order.find({ ...dateFilter, status: "completed" })
      .populate("items.product", "name")
      .sort({ createdAt: -1 })

    const products = await Product.find().sort({ name: 1 })

    // Create workbook
    const workbook = new ExcelJS.Workbook()

    // Orders sheet
    const ordersSheet = workbook.addWorksheet("Đơn hàng")
    ordersSheet.columns = [
      { header: "Mã đơn hàng", key: "orderNumber", width: 15 },
      { header: "Ngày tạo", key: "createdAt", width: 15 },
      { header: "Khách hàng", key: "customerName", width: 20 },
      { header: "Số điện thoại", key: "customerPhone", width: 15 },
      { header: "Tổng tiền", key: "totalAmount", width: 15 },
      { header: "Trạng thái", key: "status", width: 12 },
    ]

    orders.forEach((order) => {
      ordersSheet.addRow({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toLocaleDateString("vi-VN"),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status === "completed" ? "Hoàn thành" : order.status,
      })
    })

    // Products sheet
    const productsSheet = workbook.addWorksheet("Sản phẩm")
    productsSheet.columns = [
      { header: "Mã sản phẩm", key: "code", width: 15 },
      { header: "Tên sản phẩm", key: "name", width: 25 },
      { header: "Danh mục", key: "category", width: 15 },
      { header: "Đơn vị", key: "unit", width: 10 },
      { header: "Giá nhập", key: "importPrice", width: 15 },
      { header: "Giá bán", key: "sellPrice", width: 15 },
      { header: "Tồn kho", key: "stock", width: 10 },
      { header: "Ngưỡng cảnh báo", key: "lowStockThreshold", width: 15 },
    ]

    products.forEach((product) => {
      productsSheet.addRow({
        code: product.code,
        name: product.name,
        category: product.category,
        unit: product.unit,
        importPrice: product.importPrice,
        sellPrice: product.sellPrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      })
    })

    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=bao-cao-${new Date().toISOString().split("T")[0]}.xlsx`)

    // Write to response
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Export Excel error:", error)
    res.status(500).json({ message: "Lỗi server khi xuất báo cáo" })
  }
})

module.exports = router
