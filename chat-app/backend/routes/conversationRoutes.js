const express = require("express");
const router = express.Router();
const { getConversations, getOrCreateConversation, getMessages } = require("../controllers/conversationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getConversations);
router.get("/with/:userId", protect, getOrCreateConversation);
router.get("/:conversationId/messages", protect, getMessages);

module.exports = router;
