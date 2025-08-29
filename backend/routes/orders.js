const express = require("express")
const Order = require("../models/Order")
const Product = require("../models/Product")
const auth = require("../middleware/auth")
const router = express.Router()

// Get all orders with optional date filtering
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

    const orders = await Order.find(dateFilter).populate("items.product", "name sellPrice unit").sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    console.error("Get orders error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product", "name sellPrice unit")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json(order)
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" })
    }

    await Order.findByIdAndDelete(req.params.id)
    res.json({ message: "Đơn hàng đã được xóa thành công" })
  } catch (error) {
    console.error("Delete order error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
})

// Create order
router.post("/", auth, async (req, res) => {
  try {
    const { customerName, customerPhone, items } = req.body

    // Validate input
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" })
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ""))) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" })
    }

    // Calculate total and validate stock
    let totalAmount = 0
    const orderItems = []
    const stockUpdates = []

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Thông tin sản phẩm không hợp lệ" })
      }

      const product = await Product.findById(item.productId)
      if (!product) {
        return res.status(400).json({ message: `Sản phẩm không tồn tại` })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.stock}, yêu cầu: ${item.quantity}`,
        })
      }

      const itemTotal = product.sellPrice * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.sellPrice,
      })

      stockUpdates.push({
        productId: product._id,
        quantity: item.quantity,
      })
    }

    // Generate order number here, before creating the order document
    const today = new Date()
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0")

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const todayCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })

    const newOrderNumber = `ORD${dateStr}${String(todayCount + 1).padStart(3, "0")}`

    // Create order
    const order = new Order({
      orderNumber: newOrderNumber, // Assign the generated order number
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: orderItems,
      totalAmount,
    })

    await order.save()

    // Update product stock after successful order creation
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(update.productId, { $inc: { stock: -update.quantity } }, { new: true })
    }

    // Populate and return the created order
    await order.populate("items.product", "name sellPrice unit")

    res.status(201).json(order)
  } catch (error) {
    console.error("Create order error:", error)
    // Check for duplicate key error (e.g., if orderNumber is somehow duplicated)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Lỗi tạo số đơn hàng trùng lặp. Vui lòng thử lại." })
    }
    res.status(500).json({ message: "Lỗi server khi tạo đơn hàng" })
  }
})

// Update order status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" })
    }

    // If cancelling a pending order, restore stock
    if (order.status === "pending" && status === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true })
      }
    }

    order.status = status
    await order.save()

    await order.populate("items.product", "name sellPrice unit")

    res.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái" })
  }
})

// Delete order (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" })
    }

    // Restore stock if order was pending
    if (order.status === "pending") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true })
      }
    }

    await Order.findByIdAndDelete(req.params.id)
    res.json({ message: "Xóa đơn hàng thành công" })
  } catch (error) {
    console.error("Delete order error:", error)
    res.status(500).json({ message: "Lỗi server khi xóa đơn hàng" })
  }
})

module.exports = router
