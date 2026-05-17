const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    // Unread counts per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure exactly 2 participants for 1-to-1 chats
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
