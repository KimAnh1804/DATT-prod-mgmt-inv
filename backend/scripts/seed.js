const mongoose = require("mongoose")
const User = require("../models/User")
const Product = require("../models/Product")
require("dotenv").config()

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_management")
    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Product.deleteMany({})

    // Create admin user
    const adminUser = new User({
      username: "admin",
      password: "admin123",
      role: "admin",
    })
    await adminUser.save()
    console.log("Admin user created")

    // Create sample products
    const sampleProducts = [
      {
        code: "SP001",
        name: "Laptop Dell Inspiron 15",
        category: "Electronics",
        unit: "Chiếc",
        importPrice: 15000000,
        sellPrice: 18000000,
        stock: 25,
      },
      {
        code: "SP002",
        name: "Chuột không dây Logitech",
        category: "Electronics",
        unit: "Chiếc",
        importPrice: 300000,
        sellPrice: 450000,
        stock: 50,
      },
      {
        code: "SP003",
        name: "Bàn phím cơ Gaming",
        category: "Electronics",
        unit: "Chiếc",
        importPrice: 800000,
        sellPrice: 1200000,
        stock: 30,
      },
      {
        code: "SP004",
        name: "Màn hình Samsung 24 inch",
        category: "Electronics",
        unit: "Chiếc",
        importPrice: 3000000,
        sellPrice: 3800000,
        stock: 15,
      },
      {
        code: "SP005",
        name: "Tai nghe Sony WH-1000XM4",
        category: "Electronics",
        unit: "Chiếc",
        importPrice: 6000000,
        sellPrice: 7500000,
        stock: 8,
      },
    ]

    await Product.insertMany(sampleProducts)
    console.log("Sample products created")

    console.log("Database seeded successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Seeding error:", error)
    process.exit(1)
  }
}

seedData()
