const Bid = require("../models/bid.model");
const Product = require("../models/product.model");
const Seller = require("../models/seller.model");
const mongoose = require("mongoose");

// In handleBidResponse controller
const handleBidResponse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId, acceptedQuantity } = req.body;
    const sellerId = req.user._id;

    const bid = await Bid.findById(bidId).session(session);
    if (!bid || bid.status === "filled") throw new Error("Bid not available");

    // Check if seller already responded
    const existingResponse = bid.responses.find((r) =>
      r.sellerId.equals(sellerId)
    );
    if (existingResponse) {
      throw new Error("Seller already responded to this bid");
    }

    const product = await Product.findOne({
      sellerId,
      productType: bid.productType,
      isAvailable: true,
    }).session(session);

    if (!product) throw new Error("Product not available");

    // Calculate actual acceptable quantity
    const acceptableQuantity = Math.min(
      acceptedQuantity,
      bid.remainingQuantity,
      product.quantity
    );

    if (acceptableQuantity <= 0) {
      throw new Error("No quantity available to fulfill");
    }

    // Update product and bid
    console.log(product.quantity, bid.remainingQuantity);
    product.quantity -= acceptableQuantity;
    if (product.quantity === 0) product.isAvailable = false;

    bid.remainingQuantity -= acceptableQuantity;
    console.log(bid.remainingQuantity);
    bid.status = bid.remainingQuantity > 0 ? "partial" : "filled";

    bid.responses.push({
      sellerId,
      acceptedQuantity: acceptableQuantity,
      responseStatus: "accepted",
    });

    await product.save({ session });
    await bid.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Notify buyer
    // io.to(bid.buyerId.toString()).emit("bidUpdate", {
    //   bidId: bid._id,
    //   remainingQuantity: bid.remainingQuantity,
    // });

    // Find next seller if needed
    if (bid.remainingQuantity > 0) {
      const newSession = await mongoose.startSession();
      try {
        const nextSeller = await Seller.findOne({
          location: {
            $near: {
              $geometry: bid.buyerId.location,
              $maxDistance: 50000,
            },
          },
          _id: {
            $nin: bid.responses.map((r) => r.sellerId).concat(sellerId),
          },
        })
          .populate("products")
          .session(newSession);

        if (nextSeller) {
          io.to(nextSeller._id.toString()).emit("newBid", {
            bidId: bid._id,
            productType: bid.productType,
            quantity: bid.remainingQuantity,
            pricePerTon: bid.priceperton,
          });
        } else {
          // Update status to partial if no more sellers
          await Bid.findByIdAndUpdate(
            bidId,
            { status: "partial" },
            { session: newSession }
          );
        }
      } finally {
        newSession.endSession();
      }
    }

    res.status(200).json(bid);
  } catch (error) {
    if (session.transaction.isActive) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  handleBidResponse,
};
