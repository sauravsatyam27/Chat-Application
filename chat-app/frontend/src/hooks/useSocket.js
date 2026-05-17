import { useEffect } from "react";
import { getSocket, initSocket } from "../utils/socket";
import useAuthStore from "../context/authStore";
import useChatStore from "../context/chatStore";

export const useSocket = () => {
  const { user, token } = useAuthStore();
  const {
    addMessage, deleteMessage, setTyping, updateConversationLastMessage,
    updateGroupLastMessage, markRead, setOnlineUsers, updateUserOnlineStatus, addGroup,
    activeChat,
  } = useChatStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = initSocket(token);

    // Online users
    socket.on("users:online", (users) => setOnlineUsers(users));
    socket.on("user:online", ({ userId, isOnline, lastSeen }) =>
      updateUserOnlineStatus(userId, isOnline, lastSeen)
    );

    // 1-to-1 messages
    socket.on("message:received", ({ message, conversationId }) => {
      if (activeChat?.type === "conversation" && activeChat?.id === conversationId.toString()) {
        addMessage(message);
      }
      updateConversationLastMessage(conversationId, message);
    });

    // Group messages
    socket.on("group:message:received", ({ message, groupId }) => {
      if (activeChat?.type === "group" && activeChat?.id === groupId.toString()) {
        addMessage(message);
      }
      updateGroupLastMessage(groupId, message);
    });

    // Typing
    socket.on("typing:start", ({ userId, conversationId }) => setTyping(conversationId, userId, true));
    socket.on("typing:stop", ({ userId, conversationId }) => setTyping(conversationId, userId, false));

    // Message deleted
    socket.on("message:deleted", ({ messageId }) => deleteMessage(messageId));

    // Group events
    socket.on("group:added", ({ group }) => addGroup(group));

    // Read receipts
    socket.on("messages:read", ({ conversationId }) => markRead(conversationId));

    return () => {
      socket.off("users:online");
      socket.off("user:online");
      socket.off("message:received");
      socket.off("group:message:received");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:deleted");
      socket.off("group:added");
      socket.off("messages:read");
    };
  }, [token, user, activeChat]);
};
