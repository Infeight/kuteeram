const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceperton: {
      type: Number,
      required: true,
      min: 1,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    remainingQuantity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "partial", "filled", "cancelled"],
      default: "open",
    },
    responses: [
      {
        sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller",
        },
        acceptedQuantity: Number,
        responseStatus: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
        },
      },
    ],
  },
  { timestamps: true }
);

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
