const { Router } = require("express");
const { verifyWorldId } = require("../controllers/authWorldCoin");

const router = Router();

router.post("/verify-worldId", verifyWorldId);

module.exports = router;