import { useState, useRef, useCallback } from "react";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import { getSocket } from "../../utils/socket";
import api from "../../utils/api";

const quickEmojis = ["👍", "🔥", "🎉", "❤️", "😂", "🙏"];
const maxChars = 1200;

export default function MessageInput({ replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pickedFileName, setPickedFileName] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useAuthStore();
  const { activeChat, addMessage } = useChatStore();

  const isGroup = activeChat?.type === "group";
  const otherUserId = !isGroup ? activeChat?.data?.otherUser?._id : null;
  const remainingChars = maxChars - text.length;

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

  const updateText = (value) => {
    setText(value.slice(0, maxChars));
    setError("");
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleTextChange = (e) => updateText(e.target.value);

  const addEmoji = (emoji) => {
    updateText(`${text}${emoji}`);
  };

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !activeChat) return;

    const socket = getSocket();
    if (!socket) {
      setError("Connection is not ready yet. Try again in a moment.");
      return;
    }

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
    setError("");
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

    setPickedFileName(file.name);
    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (isGroup) formData.append("groupId", activeChat.id);
      else formData.append("conversationId", activeChat.id);
      if (replyTo) formData.append("replyTo", replyTo._id);

      const { data } = await api.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setPickedFileName("");
      e.target.value = "";
    }
  };

  return (
    <div className="px-4 sm:px-6 pb-5 pt-2 flex-shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 bg-dark-900/90 border border-white/10 rounded-xl px-4 py-2.5 mb-2">
          <div className="w-0.5 h-8 bg-primary-400 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-primary-300 font-medium">{replyTo.sender?.name || user?.name}</span>
            <p className="text-xs text-slate-400 truncate">{replyTo.content || replyTo.fileName || "Attachment"}</p>
          </div>
          <button onClick={onCancelReply} className="icon-button text-slate-500 hover:text-slate-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {(pickedFileName || error) && (
        <div className={`mb-2 rounded-xl border px-3 py-2 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-primary-400/30 bg-primary-500/10 text-primary-100"}`}>
          {error || `Uploading ${pickedFileName}...`}
        </div>
      )}

      <div className="composer-shell">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
          <div className="flex items-center gap-1">
            {quickEmojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="emoji-button"
                disabled={isUploading}
              >
                {emoji}
              </button>
            ))}
          </div>
          <span className={`text-xs ${remainingChars < 80 ? "text-amber-300" : "text-slate-600"}`}>
            {remainingChars}
          </span>
        </div>

        <div className="flex items-end gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file"
            className="icon-button text-slate-500 hover:text-primary-300 flex-shrink-0 mb-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip" />

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

          <button onClick={sendMessage} disabled={!text.trim() || isUploading}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
