import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import api from "../../utils/api";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { conversations, groups, activeChat, setActiveChat, searchUsers, searchResults, clearSearch } = useChatStore();
  const [tab, setTab] = useState("chats"); // 'chats' | 'groups'
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    searchUsers(e.target.value);
  };

  const startChat = async (targetUser) => {
    const { data } = await api.get(`/conversations/with/${targetUser._id}`);
    setActiveChat("conversation", data.conversation._id, data.conversation);
    setSearch("");
    clearSearch();
  };

  const handleConversationClick = (conv) => {
    setActiveChat("conversation", conv._id, conv);
  };

  const handleGroupClick = (group) => {
    setActiveChat("group", group._id, group);
  };

  const getAvatar = (name, avatar) => {
    if (avatar) return <img src={avatar} className="w-full h-full object-cover" alt={name} />;
    return (
      <span className="text-white font-semibold text-sm">
        {name?.charAt(0)?.toUpperCase()}
      </span>
    );
  };

  return (
    <aside className="w-80 flex flex-col bg-dark-900 border-r border-slate-800 h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-white">ChatMERN</h1>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* User profile mini */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getAvatar(user?.name, user?.avatar)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-green-400">● Online</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search users to chat..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-dark-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            {searchResults.map((u) => (
              <button key={u._id} onClick={() => startChat(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-dark-850 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {getAvatar(u.name, u.avatar)}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                {u.isOnline && <span className="ml-auto w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {["chats", "groups"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-300"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "chats" ? (
          conversations.length === 0 ? (
            <p className="text-center text-slate-600 text-sm mt-8 px-4">Search for users above to start chatting</p>
          ) : (
            conversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeChat?.id === conv._id;
              return (
                <button key={conv._id} onClick={() => handleConversationClick(conv)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                      {getAvatar(other?.name, other?.avatar)}
                    </div>
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{other?.name}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-1">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage?.isDeleted ? "Message deleted" : conv.lastMessage?.content || "Start a conversation"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          <>
            <button className="w-full text-left px-3 py-2.5 text-sm text-primary-500 hover:text-primary-400 font-medium flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Group
            </button>
            {groups.map((group) => {
              const isActive = activeChat?.id === group._id;
              return (
                <button key={group._id} onClick={() => handleGroupClick(group)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                  <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {group.avatar
                      ? <img src={group.avatar} className="w-full h-full object-cover" alt={group.name} />
                      : <span className="text-white font-semibold text-sm">{group.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">{group.name}</p>
                    <p className="text-xs text-slate-500">{group.members?.length} members</p>
                  </div>
                  {group.unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {group.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}
