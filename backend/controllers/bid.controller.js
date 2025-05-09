const Bid = require("../models/bid.model");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const Buyer = require("../models/buyer.model");
const mongoose = require("mongoose");
const createbid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let newbid;
  let validSellers;

  try {
    const { productType, quantity, priceperton } = req.body;
    const buyerId = req.user._id;

    // Create bid
    newbid = await Bid.create(
      [
        {
          productType,
          quantity,
          priceperton,
          buyerId,
          remainingQuantity: quantity,
        },
      ],
      { session }
    );

    // Find nearest sellers
    const buyer = await Buyer.findById(buyerId).session(session);
    const sellers = await Seller.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              buyer.location.coordinates[0],
              buyer.location.coordinates[1],
            ],
          },
          $maxDistance: 50000,
        },
      },
    }).session(session);
    console.log(sellers);
    // Validate sellers
    validSellers = await Promise.all(
      sellers.map(async (seller) => {
        const product = await Product.findOne({
          sellerId: seller._id,
          productType,
          priceperton: { $lte: priceperton },
          isAvailable: true,
        }).session(session);
        return product ? seller : null;
      })
    );
    console.log(validSellers);
    // Commit transaction before notifications
    await session.commitTransaction();
  } catch (error) {
    // Only abort if transaction is still active
    if (session.transaction.isActive) {
      await session.abortTransaction();
    }
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }

  //Send notifications outside transaction
    // try {
    //   validSellers
    //     .filter((s) => s)
    //     .forEach((seller) => {
    //       io.to(seller._id.toString()).emit("newbid", {
    //         bidId: newbid[0]._id,
    //         productType,
    //         quantity: newbid[0].remainingQuantity,
    //         priceperton,
    //       });
    //     });
    // } catch (error) {
    //   console.error("Notification error:", error);
    // }

  res.status(201).json(newbid[0]);
};

module.exports = {
  createbid,
};
