const Product = require("../models/product.model");
const addProduct = async (req, res) => {
  try {
    const { productType, quantity, priceperton, isAvailable = true } = req.body;
    if (!productType || !quantity || !priceperton) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Create product
    const productAdded = await Product.create({
      sellerId: req.user._id,
      productType,
      quantity,
      priceperton,
      isAvailable,
    });

    res.status(201).json({
      success: true,
      data: productAdded,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

module.exports = { addProduct };
