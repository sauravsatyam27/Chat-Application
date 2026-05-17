const { socketAuth } = require("../middleware/auth");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Group = require("../models/Group");

// Track online users: userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  // Auth middleware for every socket connection
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

    // Mark user online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });

    // Join personal room (for direct messages)
    socket.join(userId);

    // Notify all users that this user is online
    socket.broadcast.emit("user:online", { userId, isOnline: true });

    // Send current online users list to the newly connected user
    socket.emit("users:online", Array.from(onlineUsers.keys()));

    // ─── JOIN GROUP ROOMS ───────────────────────────────────────────
    const userGroups = await Group.find({ members: userId }).select("_id");
    userGroups.forEach((group) => socket.join(group._id.toString()));

    // ─── SEND MESSAGE (1-to-1) ──────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { conversationId, receiverId, content, type = "text", fileUrl, fileName, replyTo } = data;

        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else {
          // Find or create conversation
          conversation = await Conversation.findOne({
            participants: { $all: [userId, receiverId] },
          });
          if (!conversation) {
            conversation = await Conversation.create({ participants: [userId, receiverId] });
          }
        }

        const message = await Message.create({
          sender: userId,
          conversation: conversation._id,
          type,
          content,
          fileUrl,
          fileName,
          readBy: [userId],
          replyTo,
        });

        await message.populate("sender", "name avatar");
        if (replyTo) await message.populate("replyTo", "content sender type");

        // Update conversation's last message and unread count
        const receiverIdStr = conversation.participants
          .find((p) => p.toString() !== userId)
          ?.toString();

        const currentUnread = conversation.unreadCount?.get(receiverIdStr) || 0;
        conversation.lastMessage = message._id;
        conversation.unreadCount = conversation.unreadCount || new Map();
        conversation.unreadCount.set(receiverIdStr, currentUnread + 1);
        await conversation.save();

        // Emit to sender's room
        socket.emit("message:received", { message, conversationId: conversation._id });

        // Emit to receiver's room
        const receiverSocketId = onlineUsers.get(receiverIdStr);
        if (receiverSocketId) {
          io.to(receiverIdStr).emit("message:received", {
            message,
            conversationId: conversation._id,
          });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── SEND GROUP MESSAGE ─────────────────────────────────────────
    socket.on("group:message:send", async (data) => {
      try {
        const { groupId, content, type = "text", fileUrl, fileName, replyTo } = data;

        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(userId)) {
          return socket.emit("error", { message: "Not a member of this group" });
        }

        const message = await Message.create({
          sender: userId,
          group: groupId,
          type,
          content,
          fileUrl,
          fileName,
          readBy: [userId],
          replyTo,
        });

        await message.populate("sender", "name avatar");
        if (replyTo) await message.populate("replyTo", "content sender type");

        // Update group last message + unread for all members except sender
        group.lastMessage = message._id;
        group.members
          .filter((m) => m.toString() !== userId)
          .forEach((memberId) => {
            const current = group.unreadCount?.get(memberId.toString()) || 0;
            group.unreadCount.set(memberId.toString(), current + 1);
          });
        await group.save();

        // Emit to entire group room
        io.to(groupId).emit("group:message:received", { message, groupId });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── TYPING INDICATORS ──────────────────────────────────────────
    socket.on("typing:start", ({ conversationId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(groupId).emit("typing:start", { userId, conversationId: groupId, isGroup: true });
      } else {
        io.to(receiverId).emit("typing:start", { userId, conversationId });
      }
    });

    socket.on("typing:stop", ({ conversationId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(groupId).emit("typing:stop", { userId, conversationId: groupId, isGroup: true });
      } else {
        io.to(receiverId).emit("typing:stop", { userId, conversationId });
      }
    });

    // ─── READ RECEIPTS ──────────────────────────────────────────────
    socket.on("messages:read", async ({ conversationId, senderId }) => {
      try {
        // Mark all unread messages in this conversation as read
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        // Reset unread count
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${userId}`]: 0,
        });

        // Notify sender their messages were read
        io.to(senderId).emit("messages:read", { conversationId, readBy: userId });
      } catch (err) {
        console.error("Read receipt error:", err);
      }
    });

    socket.on("group:messages:read", async ({ groupId }) => {
      try {
        await Message.updateMany(
          { group: groupId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        await Group.findByIdAndUpdate(groupId, { [`unreadCount.${userId}`]: 0 });
        socket.to(groupId).emit("group:messages:read", { groupId, readBy: userId });
      } catch (err) {
        console.error("Group read error:", err);
      }
    });

    // ─── DELETE MESSAGE ─────────────────────────────────────────────
    socket.on("message:delete", async ({ messageId, conversationId, groupId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) {
          return socket.emit("error", { message: "Cannot delete this message" });
        }
        message.isDeleted = true;
        message.content = "";
        await message.save();

        if (groupId) {
          io.to(groupId).emit("message:deleted", { messageId, groupId });
        } else {
          const conversation = await Conversation.findById(conversationId);
          const receiverId = conversation.participants
            .find((p) => p.toString() !== userId)
            ?.toString();
          io.to(userId).emit("message:deleted", { messageId, conversationId });
          io.to(receiverId).emit("message:deleted", { messageId, conversationId });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── JOIN GROUP ─────────────────────────────────────────────────
    socket.on("group:join", (groupId) => {
      socket.join(groupId);
    });

    // ─── DISCONNECT ─────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: "",
      });
      socket.broadcast.emit("user:online", { userId, isOnline: false, lastSeen: new Date() });
    });
  });
};
