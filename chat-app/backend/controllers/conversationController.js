const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "name avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    // Add unread count for current user
    const withUnread = conversations.map((conv) => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
      // The "other" participant
      otherUser: conv.participants.find((p) => p._id.toString() !== req.user._id.toString()),
    }));

    res.json({ success: true, conversations: withUnread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get or create a 1-to-1 conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "name avatar isOnline lastSeen")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, userId] });
      await conversation.populate("participants", "name avatar isOnline lastSeen");
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get messages for a conversation (with pagination)
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const messages = await Message.find({ conversation: conversationId, isDeleted: false })
      .populate("sender", "name avatar")
      .populate("replyTo", "content sender type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, messages: messages.reverse(), page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
