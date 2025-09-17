const express = require("express") 
const jwt = require("jsonwebtoken")
const User = require("../models/User") 
const router = express.Router() 






// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    //Kiểm tra user có tồn tại không
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Kiểm tra mật khẩu  
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Tạo JWT token
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "24h",
    })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) { 
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" }) 
  }
})

// Verify token
router.get("/verify", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(401).json({ message: "Invalid token" })
  }
})

// Tạo admin mặc định
router.post("/create-admin", async (req, res) => { 
  try {
    const existingUser = await User.findOne({ username: "admin" })
    if (existingUser) {
      return res.status(400).json({ message: "Admin user already exists" })
    }

    const adminUser = new User({
      username: "admin",
      password: "admin123",
      role: "admin",
    })

    await adminUser.save()
    res.json({ message: "Admin user created successfully" })
  } catch (error) {
    console.error("Create admin error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
