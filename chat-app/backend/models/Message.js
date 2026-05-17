const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Either conversation or group
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    content: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    // Read receipts: array of user IDs who have read this message
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
