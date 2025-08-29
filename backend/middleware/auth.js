const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Không có token, truy cập bị từ chối" })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return res.status(401).json({ message: "Token không hợp lệ" })
      }

      req.user = user
      next()
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      return res.status(401).json({ message: "Token không hợp lệ" })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({ message: "Lỗi server trong xác thực" })
  }
}

module.exports = auth
