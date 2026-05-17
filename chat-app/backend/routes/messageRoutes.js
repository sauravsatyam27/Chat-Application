// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const { uploadFile, searchMessages } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { uploadImage } = require("../middleware/cloudinary");

router.post("/upload", protect, uploadImage.single("file"), uploadFile);
router.get("/search", protect, searchMessages);

module.exports = router;
