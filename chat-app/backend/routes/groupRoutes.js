const express = require("express");
const router = express.Router();
const { createGroup, getGroups, getGroupMessages, addMember, removeMember } = require("../controllers/groupController");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/cloudinary");

router.post("/", protect, uploadAvatar.single("avatar"), createGroup);
router.get("/", protect, getGroups);
router.get("/:groupId/messages", protect, getGroupMessages);
router.post("/:groupId/members", protect, addMember);
router.delete("/:groupId/members/:userId", protect, removeMember);

module.exports = router;
