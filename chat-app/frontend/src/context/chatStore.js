import { create } from "zustand";
import api from "../utils/api";

const useChatStore = create((set, get) => ({
  conversations: [],
  groups: [],
  activeChat: null, // { type: 'conversation'|'group', id, data }
  messages: [],
  onlineUsers: [],
  typingUsers: {}, // { conversationId: [userId] }
  isLoadingMessages: false,
  searchResults: [],

  // ─── ONLINE USERS ───────────────────────────────────────────────
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updateUserOnlineStatus: (userId, isOnline, lastSeen) => {
    set((state) => ({
      onlineUsers: isOnline
        ? [...new Set([...state.onlineUsers, userId])]
        : state.onlineUsers.filter((id) => id !== userId),
      conversations: state.conversations.map((c) => ({
        ...c,
        otherUser: c.otherUser?._id === userId
          ? { ...c.otherUser, isOnline, lastSeen }
          : c.otherUser,
      })),
    }));
  },

  // ─── CONVERSATIONS ───────────────────────────────────────────────
  fetchConversations: async () => {
    const { data } = await api.get("/conversations");
    set({ conversations: data.conversations });
  },

  fetchGroups: async () => {
    const { data } = await api.get("/groups");
    set({ groups: data.groups });
  },

  setActiveChat: async (type, id, chatData) => {
    set({ activeChat: { type, id, data: chatData }, messages: [], isLoadingMessages: true });
    try {
      const endpoint = type === "group"
        ? `/groups/${id}/messages`
        : `/conversations/${id}/messages`;
      const { data } = await api.get(endpoint);
      set({ messages: data.messages, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  clearActiveChat: () => set({ activeChat: null, messages: [], isLoadingMessages: false }),

  // ─── MESSAGES ───────────────────────────────────────────────────
  addMessage: (message) => {
    set((state) => {
      const exists = state.messages.find((m) => m._id === message._id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: "" } : m
      ),
    }));
  },

  updateConversationLastMessage: (conversationId, message) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage: message, updatedAt: new Date() } : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

  updateGroupLastMessage: (groupId, message) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g._id === groupId ? { ...g, lastMessage: message, updatedAt: new Date() } : g
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

  // ─── TYPING ─────────────────────────────────────────────────────
  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
    });
  },

  // ─── READ ───────────────────────────────────────────────────────
  markRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  addGroup: (group) => {
    set((state) => {
      const exists = state.groups.find((g) => g._id === group._id);
      if (exists) return state;
      return { groups: [group, ...state.groups] };
    });
  },

  createGroup: async ({ name, description, members }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    members.forEach((memberId) => formData.append("members", memberId));

    const { data } = await api.post("/groups", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    set((state) => ({ groups: [data.group, ...state.groups] }));
    return data.group;
  },

  searchUsers: async (q) => {
    if (!q.trim()) return set({ searchResults: [] });
    const { data } = await api.get(`/users/search?q=${q}`);
    set({ searchResults: data.users });
  },

  clearSearch: () => set({ searchResults: [] }),
}));

export default useChatStore;
