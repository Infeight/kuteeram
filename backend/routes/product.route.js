const { Router } = require("express");
const { addProduct } = require("../controllers/product.controller");

const { protectseller, authorize } = require("../middleware/verify.middleware");

const router = Router();
router.use(protectseller);

router.post("/createproduct", authorize("seller"), addProduct);

module.exports = router;
