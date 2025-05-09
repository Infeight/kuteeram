const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: [true, "Seller is required"],
  },
  productType: {
    type: String,
    required: [true, "Product type is required"],
    trim: true,
    index: "text",
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.1, "Quantity must be greater than 0"],
  },
  priceperton: {
    type: Number,
    required: [true, "Price is required"],
    min: [1, "Price must be greater than 0"],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});
productSchema.index({
  sellerId: 1,
  productType: 1,
  priceperton: 1,
});
const Product = mongoose.model("product", productSchema);

module.exports = Product;
