import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import { getSocket } from "../../utils/socket";
import MessageInput from "./MessageInput";

export default function ChatWindow() {
  const { user } = useAuthStore();
  const { activeChat, messages, isLoadingMessages, typingUsers, markRead, clearActiveChat } = useChatStore();
  const messagesEndRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chatmern:starred") || "[]");
    } catch {
      return [];
    }
  });

  const chatData = activeChat?.data;
  const isGroup = activeChat?.type === "group";
  const otherUser = isGroup ? null : chatData?.otherUser;
  const chatName = isGroup ? chatData?.name : otherUser?.name;
  const isOtherOnline = !isGroup && otherUser?.isOnline;
  const typingList = typingUsers[activeChat?.id] || [];
  const isTyping = typingList.length > 0;

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((msg) =>
      [msg.content, msg.fileName, msg.sender?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [messages, searchTerm]);

  const starredMessages = useMemo(
    () => messages.filter((msg) => starredIds.includes(msg._id) && !msg.isDeleted),
    [messages, starredIds]
  );

  const sharedFiles = useMemo(
    () => messages.filter((msg) => (msg.type === "file" || msg.type === "image") && !msg.isDeleted),
    [messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isGroup && activeChat) {
      const socket = getSocket();
      const senderId = otherUser?._id;
      if (socket && senderId) {
        socket.emit("messages:read", { conversationId: activeChat.id, senderId });
        markRead(activeChat.id);
      }
    }
  }, [activeChat?.id]);

  useEffect(() => {
    localStorage.setItem("chatmern:starred", JSON.stringify(starredIds));
  }, [starredIds]);

  const handleDeleteMessage = (messageId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("message:delete", {
      messageId,
      conversationId: isGroup ? undefined : activeChat.id,
      groupId: isGroup ? activeChat.id : undefined,
    });
  };

  const toggleStar = (messageId) => {
    setStarredIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId]
    );
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase();

  const renderAvatar = (sender, size = "w-8 h-8") => (
    <div className={`${size} rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {sender?.avatar
        ? <img src={sender.avatar} className="w-full h-full object-cover" alt={sender.name} />
        : <span className="text-white font-semibold text-xs">{getInitial(sender?.name)}</span>
      }
    </div>
  );

  const renderMessage = (msg, idx) => {
    const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
    const showAvatar = isGroup && !isMine;
    const prevMsg = filteredMessages[idx - 1];
    const isSameGroup = prevMsg?.sender?._id === msg.sender?._id && !isMine;
    const isRead = msg.readBy?.some((id) => id !== user?._id);
    const isStarred = starredIds.includes(msg._id);

    return (
      <div key={msg._id} className={`flex gap-2 group message-enter ${isMine ? "flex-row-reverse" : "flex-row"} ${isSameGroup ? "mt-1" : "mt-3"}`}>
        {showAvatar && (
          <div className="mt-auto">
            {!isSameGroup ? renderAvatar(msg.sender) : <div className="w-8" />}
          </div>
        )}

        <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-xs lg:max-w-md`}>
          {showAvatar && !isSameGroup && (
            <span className="text-xs text-primary-300 mb-1 ml-1">{msg.sender?.name}</span>
          )}

          {msg.replyTo && !msg.isDeleted && (
            <div className={`text-xs px-3 py-1.5 rounded-xl mb-1 border-l-2 border-primary-500 bg-dark-900/80 ${isMine ? "text-right" : "text-left"}`}>
              <span className="text-primary-300 block font-medium">{msg.replyTo?.sender?.name || "Unknown"}</span>
              <span className="text-slate-400 truncate block max-w-[200px]">{msg.replyTo?.content}</span>
            </div>
          )}

          <button onClick={clearActiveChat} title="Back to chats" className="icon-button text-slate-400 hover:text-white md:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            {msg.isDeleted ? (
              <div className="px-4 py-2 rounded-2xl bg-dark-800/50 border border-slate-700/50 italic text-slate-500 text-sm">
                Message deleted
              </div>
            ) : msg.type === "image" ? (
              <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                <img src={msg.fileUrl} alt="Shared image" className="max-w-xs rounded-2xl border border-white/10 cursor-pointer hover:opacity-90 transition-opacity" />
              </a>
            ) : msg.type === "file" ? (
              <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                className={`${isMine ? "chat-bubble-sent" : "chat-bubble-received"} flex items-center gap-2`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm truncate">{msg.fileName || "Download file"}</span>
              </a>
            ) : (
              <div className={isMine ? "chat-bubble-sent" : "chat-bubble-received"}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}

            {!msg.isDeleted && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-28" : "-right-28"} hidden group-hover:flex items-center gap-1`}>
                <button title="Reply" onClick={() => setReplyTo(msg)} className="message-action">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button title="Star" onClick={() => toggleStar(msg._id)} className={`message-action ${isStarred ? "text-amber-300" : ""}`}>
                  <svg className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118L3.08 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.516-4.674z" />
                  </svg>
                </button>
                {isMine && (
                  <button title="Delete" onClick={() => handleDeleteMessage(msg._id)} className="message-action hover:text-red-300 hover:bg-red-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 mt-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-xs text-slate-600">{format(new Date(msg.createdAt), "HH:mm")}</span>
            {isStarred && <span className="text-xs text-amber-300">Starred</span>}
            {isMine && !msg.isDeleted && (
              <svg className={`w-3.5 h-3.5 ${isRead ? "text-primary-300" : "text-slate-600"}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-chat-pattern">
      <div className="flex flex-col h-full min-w-0 flex-1">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-dark-900/80 backdrop-blur border-b border-white/10 flex-shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-primary-600 flex items-center justify-center overflow-hidden">
              {(isGroup ? chatData?.avatar : otherUser?.avatar)
                ? <img src={isGroup ? chatData.avatar : otherUser.avatar} className="w-full h-full object-cover" alt={chatName} />
                : <span className="text-white font-semibold text-sm">{getInitial(chatName)}</span>
              }
            </div>
            {!isGroup && isOtherOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-dark-900" />}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-white truncate">{chatName}</h2>
            <p className="text-xs text-slate-500">
              {isGroup ? `${chatData?.members?.length || 0} members` : isOtherOnline ? "Online" : "Offline"}
            </p>
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-2 w-full max-w-xs">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages"
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <button onClick={() => setShowDetails((value) => !value)} title="Chat details" className="icon-button text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sm:hidden px-4 pt-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages"
            className="input-field py-2 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600 text-sm">{messages.length === 0 ? "No messages yet. Say hello!" : "No matching messages found."}</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => renderMessage(msg, idx))
          )}

          {isTyping && (
            <div className="flex gap-2 mt-3 items-end">
              <div className="chat-bubble-received px-4 py-3 flex items-center gap-1">
                <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <MessageInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
      </div>

      {showDetails && (
        <aside className="hidden lg:flex w-80 flex-col border-l border-white/10 bg-dark-900/70 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Chat details</h3>
          <div className="glass-panel p-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center overflow-hidden mx-auto mb-3">
              {(isGroup ? chatData?.avatar : otherUser?.avatar)
                ? <img src={isGroup ? chatData.avatar : otherUser.avatar} className="w-full h-full object-cover" alt={chatName} />
                : <span className="text-white text-xl font-semibold">{getInitial(chatName)}</span>}
            </div>
            <p className="font-semibold text-white">{chatName}</p>
            <p className="text-xs text-slate-500 mt-1">{isGroup ? chatData?.description || "Group conversation" : otherUser?.email}</p>
          </div>

          <div className="mt-5">
            <p className="detail-heading">Starred messages</p>
            <div className="space-y-2">
              {starredMessages.length === 0 ? (
                <p className="text-sm text-slate-600">No starred messages yet.</p>
              ) : starredMessages.slice(-5).reverse().map((msg) => (
                <button key={msg._id} className="detail-item text-left" onClick={() => setSearchTerm(msg.content || msg.fileName || "")}>
                  <span className="block text-xs text-primary-300">{msg.sender?.name || "You"}</span>
                  <span className="block truncate text-sm text-slate-300">{msg.content || msg.fileName || "Shared media"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="detail-heading">Shared files</p>
            <div className="space-y-2">
              {sharedFiles.length === 0 ? (
                <p className="text-sm text-slate-600">Nothing shared yet.</p>
              ) : sharedFiles.slice(-5).reverse().map((msg) => (
                <a key={msg._id} href={msg.fileUrl} target="_blank" rel="noreferrer" className="detail-item">
                  <span className="block truncate text-sm text-slate-300">{msg.fileName || (msg.type === "image" ? "Shared image" : "File")}</span>
                  <span className="text-xs text-slate-600">{format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
