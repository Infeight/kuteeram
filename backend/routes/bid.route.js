const { Router } = require("express");
const { createbid } = require("../controllers/bid.controller");
const { handleBidResponse } = require("../controllers/response.controller");
const {
  protectbuyer,
  protectseller,
} = require("../middleware/verify.middleware");

const router = Router();
router.post("/create", protectbuyer, createbid);
router.post("/respond", protectseller, handleBidResponse);

module.exports = router;
