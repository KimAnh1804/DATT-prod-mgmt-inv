const express = require("express")
const InventoryTransaction = require("../models/InventoryTransaction")
const Product = require("../models/Product")
const auth = require("../middleware/auth")
const router = express.Router()

// Get all transactions with optional filtering
router.get("/transactions", auth, async (req, res) => {
  try {
    const { type, productId, startDate, endDate } = req.query

    const filter = {}

    if (type && ["import", "export"].includes(type)) {
      filter.type = type
    }

    if (productId) {
      filter.product = productId
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    }

    const transactions = await InventoryTransaction.find(filter)
      .populate("product", "name unit code")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(100) // Limit to last 100 transactions

    res.json(transactions)
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử giao dịch" })
  }
})

// Get transaction statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    }

    const stats = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ])

    const importStats = stats.find((stat) => stat._id === "import") || {
      totalTransactions: 0,
      totalQuantity: 0,
    }
    const exportStats = stats.find((stat) => stat._id === "export") || {
      totalTransactions: 0,
      totalQuantity: 0,
    }

    // Get most active products
    const topProducts = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$product",
          totalTransactions: { $sum: 1 },
          totalImport: {
            $sum: { $cond: [{ $eq: ["$type", "import"] }, "$quantity", 0] },
          },
          totalExport: {
            $sum: { $cond: [{ $eq: ["$type", "export"] }, "$quantity", 0] },
          },
        },
      },
      { $sort: { totalTransactions: -1 } },
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
          totalTransactions: 1,
          totalImport: 1,
          totalExport: 1,
        },
      },
    ])

    res.json({
      import: importStats,
      export: exportStats,
      topProducts,
    })
  } catch (error) {
    console.error("Get inventory stats error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy thống kê kho" })
  }
})

// Create transaction
router.post("/transaction", auth, async (req, res) => {
  try {
    const { productId, type, quantity, note } = req.body

    // Validate input
    if (!productId || !type || !quantity) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" })
    }

    if (!["import", "export"].includes(type)) {
      return res.status(400).json({ message: "Loại giao dịch không hợp lệ" })
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Số lượng phải lớn hơn 0" })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" })
    }

    // Check if export quantity is available
    if (type === "export" && product.stock < quantity) {
      return res.status(400).json({
        message: `Không đủ hàng để xuất. Tồn kho hiện tại: ${product.stock} ${product.unit}`,
      })
    }

    // Update product stock
    const stockChange = type === "import" ? quantity : -quantity
    const updatedProduct = await Product.findByIdAndUpdate(productId, { $inc: { stock: stockChange } }, { new: true })

    // Create transaction record
    const transaction = new InventoryTransaction({
      product: productId,
      type,
      quantity: Number(quantity),
      note: note ? note.trim() : "",
      createdBy: req.user._id,
    })

    await transaction.save()
    await transaction.populate("product", "name unit code")
    await transaction.populate("createdBy", "username")

    res.status(201).json({
      transaction,
      updatedStock: updatedProduct.stock,
    })
  } catch (error) {
    console.error("Create transaction error:", error)
    res.status(500).json({ message: "Lỗi server khi tạo giao dịch" })
  }
})

// Update transaction (admin only)
router.put("/transaction/:id", auth, async (req, res) => {
  try {
    const { note } = req.body

    const transaction = await InventoryTransaction.findByIdAndUpdate(
      req.params.id,
      { note: note ? note.trim() : "" },
      { new: true },
    )
      .populate("product", "name unit code")
      .populate("createdBy", "username")

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" })
    }

    res.json(transaction)
  } catch (error) {
    console.error("Update transaction error:", error)
    res.status(500).json({ message: "Lỗi server khi cập nhật giao dịch" })
  }
})

// Delete transaction (admin only - careful with stock adjustment)
router.delete("/transaction/:id", auth, async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findById(req.params.id)
    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" })
    }

    // Reverse the stock change
    const stockChange = transaction.type === "import" ? -transaction.quantity : transaction.quantity
    await Product.findByIdAndUpdate(transaction.product, { $inc: { stock: stockChange } }, { new: true })

    await InventoryTransaction.findByIdAndDelete(req.params.id)
    res.json({ message: "Xóa giao dịch thành công" })
  } catch (error) {
    console.error("Delete transaction error:", error)
    res.status(500).json({ message: "Lỗi server khi xóa giao dịch" })
  }
})

module.exports = router
