const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Group = require("../models/Group");

// Upload and send image/file via REST (then emit via socket on frontend)
exports.uploadFile = async (req, res) => {
  try {
    const { conversationId, groupId, replyTo } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const isImage = file.mimetype?.startsWith("image/");
    const message = await Message.create({
      sender: req.user._id,
      conversation: conversationId || undefined,
      group: groupId || undefined,
      type: isImage ? "image" : "file",
      content: file.originalname || "File",
      fileUrl: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      readBy: [req.user._id],
      replyTo: replyTo || undefined,
    });

    await message.populate("sender", "name avatar");

    // Update lastMessage
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });
    } else if (groupId) {
      await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { q, conversationId, groupId } = req.query;
    const filter = { content: { $regex: q, $options: "i" }, isDeleted: false };
    if (conversationId) filter.conversation = conversationId;
    if (groupId) filter.group = groupId;

    const messages = await Message.find(filter)
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
