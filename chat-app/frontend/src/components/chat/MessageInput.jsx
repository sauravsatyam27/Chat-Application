import { useState, useRef, useCallback } from "react";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import { getSocket } from "../../utils/socket";
import api from "../../utils/api";

export default function MessageInput({ replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useAuthStore();
  const { activeChat, addMessage } = useChatStore();

  const isGroup = activeChat?.type === "group";
  const otherUserId = !isGroup ? activeChat?.data?.otherUser?._id : null;

  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    const event = isTyping ? "typing:start" : "typing:stop";
    socket.emit(event, {
      conversationId: activeChat?.id,
      receiverId: otherUserId,
      groupId: isGroup ? activeChat?.id : undefined,
    });
  }, [activeChat, otherUserId, isGroup]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
  };

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !activeChat) return;

    const socket = getSocket();
    if (!socket) return;

    const payload = {
      content,
      type: "text",
      replyTo: replyTo?._id || null,
    };

    if (isGroup) {
      socket.emit("group:message:send", { groupId: activeChat.id, ...payload });
    } else {
      socket.emit("message:send", {
        conversationId: activeChat.id,
        receiverId: otherUserId,
        ...payload,
      });
    }

    setText("");
    emitTyping(false);
    onCancelReply?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (isGroup) formData.append("groupId", activeChat.id);
      else formData.append("conversationId", activeChat.id);
      if (replyTo) formData.append("replyTo", replyTo._id);

      const { data } = await api.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add to local state and emit to socket room
      addMessage(data.message);
      const socket = getSocket();
      if (socket) {
        const event = isGroup ? "group:message:received" : "message:received";
        socket.emit(event, {
          message: data.message,
          [isGroup ? "groupId" : "conversationId"]: activeChat.id,
        });
      }
      onCancelReply?.();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="px-6 pb-6 pt-2 flex-shrink-0">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-2">
          <div className="w-0.5 h-8 bg-primary-500 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-primary-400 font-medium">{replyTo.sender?.name}</span>
            <p className="text-xs text-slate-400 truncate">{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="text-slate-500 hover:text-slate-300 p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 bg-dark-900 border border-slate-700 rounded-2xl px-4 py-3">
        {/* File upload button */}
        <button onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-slate-500 hover:text-primary-400 transition-colors flex-shrink-0 mb-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip" />

        {/* Text input */}
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={isUploading ? "Uploading..." : "Type a message..."}
          rows={1}
          disabled={isUploading}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 resize-none outline-none text-sm leading-relaxed max-h-32"
          style={{ overflowY: text.split("\n").length > 4 ? "auto" : "hidden" }}
        />

        {/* Send button */}
        <button onClick={sendMessage} disabled={!text.trim() || isUploading}
          className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
