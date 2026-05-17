// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/cloudinary");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadAvatar.single("avatar"), updateProfile);

module.exports = router;
