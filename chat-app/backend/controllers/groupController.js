const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const avatar = req.file ? req.file.path : "";

    // Always add creator as member + admin
    const allMembers = [...new Set([req.user._id.toString(), ...members])];

    const group = await Group.create({
      name,
      description,
      avatar,
      admin: req.user._id,
      members: allMembers,
    });

    await group.populate("members", "name avatar isOnline");
    await group.populate("admin", "name avatar");

    // Notify new members via Socket.io
    const io = req.app.get("io");
    members.forEach((memberId) => {
      io.to(memberId).emit("group:added", { group });
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user's groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name avatar isOnline")
      .populate("admin", "name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const withUnread = groups.map((g) => ({
      ...g.toObject(),
      unreadCount: g.unreadCount?.get(req.user._id.toString()) || 0,
    }));

    res.json({ success: true, groups: withUnread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not a member" });
    }

    const messages = await Message.find({ group: groupId })
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

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only admin can add members" });
    }
    if (group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: "User already in group" });
    }

    group.members.push(userId);
    await group.save();
    await group.populate("members", "name avatar isOnline");

    const io = req.app.get("io");
    io.to(userId).emit("group:added", { group });
    io.to(groupId).emit("group:member:added", { groupId, userId });

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove member / leave group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isAdmin = group.admin.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    const io = req.app.get("io");
    io.to(userId).emit("group:removed", { groupId });
    io.to(groupId).emit("group:member:removed", { groupId, userId });

    res.json({ success: true, message: "Member removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
