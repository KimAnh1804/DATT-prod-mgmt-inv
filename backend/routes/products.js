const express = require("express")
const Product = require("../models/Product")
const auth = require("../middleware/auth")
const router = express.Router()

// Get all products with optional filtering
router.get("/", auth, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query

    const filter = {}

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }]
    }

    if (category) {
      filter.category = category
    }

    if (lowStock === "true") {
      filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] }
    }

    const products = await Product.find(filter).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    console.error("Get products error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy danh sách sản phẩm" })
  }
})

// Get single product
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" })
    }
    res.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy thông tin sản phẩm" })
  }
})

// Create product
router.post("/", auth, async (req, res) => {
  try {
    const { code, name, category, unit, importPrice, sellPrice, stock, lowStockThreshold } = req.body

    // Validate required fields
    if (!code || !name || !category || !unit || importPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }

    // Validate prices
    if (importPrice < 0 || sellPrice < 0) {
      return res.status(400).json({ message: "Giá không được âm" })
    }

    if (sellPrice < importPrice) {
      return res.status(400).json({ message: "Giá bán không được thấp hơn giá nhập" })
    }

    // Validate stock
    if (stock < 0) {
      return res.status(400).json({ message: "Số lượng tồn kho không được âm" })
    }

    // Check if product code already exists
    const existingProduct = await Product.findOne({ code: code.trim() })
    if (existingProduct) {
      return res.status(400).json({ message: "Mã sản phẩm đã tồn tại" })
    }

    const product = new Product({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      importPrice: Number(importPrice),
      sellPrice: Number(sellPrice),
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 10,
    })

    await product.save()
    res.status(201).json(product)
  } catch (error) {
    console.error("Create product error:", error)
    if (error.code === 11000) {
      res.status(400).json({ message: "Mã sản phẩm đã tồn tại" })
    } else {
      res.status(500).json({ message: "Lỗi server khi tạo sản phẩm" })
    }
  }
})

// Update product
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, category, unit, importPrice, sellPrice, stock, lowStockThreshold } = req.body

    // Validate required fields
    if (!name || !category || !unit || importPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }

    // Validate prices
    if (importPrice < 0 || sellPrice < 0) {
      return res.status(400).json({ message: "Giá không được âm" })
    }

    if (sellPrice < importPrice) {
      return res.status(400).json({ message: "Giá bán không được thấp hơn giá nhập" })
    }

    // Validate stock
    if (stock < 0) {
      return res.status(400).json({ message: "Số lượng tồn kho không được âm" })
    }

    const updateData = {
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      importPrice: Number(importPrice),
      sellPrice: Number(sellPrice),
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold) || 10,
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" })
    }

    res.json(product)
  } catch (error) {
    console.error("Update product error:", error)
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm" })
  }
})

// Delete product
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" })
    }

    // Check if product is used in any orders
    const Order = require("../models/Order")
    const ordersWithProduct = await Order.findOne({ "items.product": req.params.id })

    if (ordersWithProduct) {
      return res.status(400).json({
        message: "Không thể xóa sản phẩm này vì đã có đơn hàng sử dụng",
      })
    }

    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: "Xóa sản phẩm thành công" })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" })
  }
})

// Get product categories
router.get("/categories/list", auth, async (req, res) => {
  try {
    const categories = await Product.distinct("category")
    res.json(categories.sort())
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ message: "Lỗi server khi lấy danh sách danh mục" })
  }
})

module.exports = router
