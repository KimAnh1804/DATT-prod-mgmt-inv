const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, //mã sp phải là duy nhất
      trim: true,  //loại bỏ khoảng trắng thừa
    },
    name: {
      type: String,
      required: true, 
      trim: true,
    },
    category: {    //loại,danh mục sản phẩm
      type: String,
      required: true,
      trim: true,
    },
    unit: {       //đơn vị tính: cái, hộp, kg
      type: String,
      required: true, //bắt buộc phải có giá trị
      trim: true,
    },
    importPrice: {   //Giá nhập vào
      type: Number,
      required: true,
      min: 0,
    },
    sellPrice: {    //Giá bán ra cho khách hàng
      type: Number,
      required: true,
      min: 0,
    },
    stock: {       //Số lượng tồn kho hiện tại
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {  //Ngưỡng cảnh báo tồn kho thấp
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Product", productSchema)
