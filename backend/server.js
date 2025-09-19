const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // URL của frontend
  credentials: true
}))
app.use(express.json())

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"))
db.once("open", () => {
  console.log("Connected to MongoDB")
})

// Models
const User = require("./models/User")
const Product = require("./models/Product")
const Order = require("./models/Order")
const InventoryTransaction = require("./models/InventoryTransaction")

// Routes
const authRoutes = require("./routes/auth")
const productRoutes = require("./routes/products")
const orderRoutes = require("./routes/orders")
const inventoryRoutes = require("./routes/inventory")
const dashboardRoutes = require("./routes/dashboard")
const reportRoutes = require("./routes/reports")
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)

  app.get("/", (req, res) => {
  res.send("Welcome to Inventory Management API");
});

})
