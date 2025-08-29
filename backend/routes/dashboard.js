const express = require("express")
const Product = require("../models/Product")
const Order = require("../models/Order")
const InventoryTransaction = require("../models/InventoryTransaction")
const auth = require("../middleware/auth")
const router = express.Router()

// Get dashboard stats
router.get("/stats", auth, async (req, res) => {
  try {
    // Basic counts
    const totalProducts = await Product.countDocuments()
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ status: "pending" })
    const completedOrders = await Order.countDocuments({ status: "completed" })

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0

    // Low stock products
    const lowStockItems = await Product.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).select("name stock unit lowStockThreshold code")

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber customerName totalAmount status createdAt")

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          month: {
            $concat: [{ $toString: "$_id.month" }, "/", { $toString: "$_id.year" }],
          },
          revenue: 1,
          orders: 1,
        },
      },
    ])

    // Top selling products (this month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const topProducts = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
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
          code: "$product.code",
          totalSold: 1,
          revenue: 1,
        },
      },
    ])

    // Inventory transactions today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const todayTransactions = await InventoryTransaction.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })

    const todayImports = await InventoryTransaction.countDocuments({
      type: "import",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })

    const todayExports = await InventoryTransaction.countDocuments({
      type: "export",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })

    // Calculate average order value
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      avgOrderValue,
      lowStockProducts: lowStockItems.length,
      lowStockItems,
      recentOrders,
      monthlyRevenue,
      topProducts,
      todayStats: {
        transactions: todayTransactions,
        imports: todayImports,
        exports: todayExports,
      },
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy thống kê dashboard" })
  }
})

// Get quick stats for widgets
router.get("/quick-stats", auth, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    })

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const todayRevenueAmount = todayRevenue.length > 0 ? todayRevenue[0].total : 0

    // This week's stats
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const weekOrders = await Order.countDocuments({
      createdAt: { $gte: startOfWeek },
    })

    const weekRevenue = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfWeek },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const weekRevenueAmount = weekRevenue.length > 0 ? weekRevenue[0].total : 0

    res.json({
      today: {
        orders: todayOrders,
        revenue: todayRevenueAmount,
      },
      week: {
        orders: weekOrders,
        revenue: weekRevenueAmount,
      },
    })
  } catch (error) {
    console.error("Get quick stats error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy thống kê nhanh" })
  }
})

module.exports = router
