import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import api from "../../utils/api";

const getAvatar = (name, avatar, className = "w-full h-full") => {
  if (avatar) return <img src={avatar} className={`${className} object-cover`} alt={name} />;
  return <span className="text-white font-semibold text-sm">{name?.charAt(0)?.toUpperCase()}</span>;
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    groups,
    activeChat,
    setActiveChat,
    searchUsers,
    searchResults,
    clearSearch,
    createGroup,
  } = useChatStore();
  const [tab, setTab] = useState("chats");
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  const stats = useMemo(() => {
    const unreadChats = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    const onlineChats = conversations.filter((conv) => conv.otherUser?.isOnline).length;
    return { unreadChats, onlineChats, groups: groups.length };
  }, [conversations, groups]);

  const filteredConversations = useMemo(() => {
    const query = listFilter.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conv) => {
      const other = conv.otherUser;
      return [other?.name, other?.email, conv.lastMessage?.content]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [conversations, listFilter]);

  const filteredGroups = useMemo(() => {
    const query = listFilter.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) =>
      [group.name, group.description].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [groups, listFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    searchUsers(value);
  };

  const startChat = async (targetUser) => {
    const { data } = await api.get(`/conversations/with/${targetUser._id}`);
    setActiveChat("conversation", data.conversation._id, data.conversation);
    setSearch("");
    clearSearch();
  };

  const toggleMember = (targetUser) => {
    setSelectedMembers((current) => {
      const exists = current.some((member) => member._id === targetUser._id);
      return exists ? current.filter((member) => member._id !== targetUser._id) : [...current, targetUser];
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      setGroupError("Add a group name first.");
      return;
    }

    setIsCreatingGroup(true);
    setGroupError("");
    try {
      const group = await createGroup({
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        members: selectedMembers.map((member) => member._id),
      });
      setActiveChat("group", group._id, group);
      setGroupForm({ name: "", description: "" });
      setSelectedMembers([]);
      setSearch("");
      clearSearch();
      setGroupOpen(false);
      setTab("groups");
    } catch (err) {
      setGroupError(err.response?.data?.message || "Could not create the group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const closeGroupModal = () => {
    setGroupOpen(false);
    setGroupError("");
  };

  const renderConversationPreview = (conv) => {
    if (conv.lastMessage?.isDeleted) return "Message deleted";
    if (conv.lastMessage?.type === "image") return "Shared an image";
    if (conv.lastMessage?.type === "file") return conv.lastMessage.fileName || "Shared a file";
    return conv.lastMessage?.content || "Start a conversation";
  };

  return (
    <aside className="w-full md:w-88 md:max-w-sm flex flex-col sidebar-surface border-r border-white/10 h-screen">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary-300/80">Realtime</p>
            <h1 className="text-2xl font-bold text-white">ChatMERN</h1>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="icon-button text-slate-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        <div className="glass-panel p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {getAvatar(user?.name, user?.avatar)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-emerald-300">Online now</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="stat-pill"><strong>{stats.onlineChats}</strong><span>Online</span></div>
            <div className="stat-pill"><strong>{stats.unreadChats}</strong><span>Unread</span></div>
            <div className="stat-pill"><strong>{stats.groups}</strong><span>Groups</span></div>
          </div>
        </div>

        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={groupOpen ? "Search users to add..." : "Search users to chat..."}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mb-3 bg-dark-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {searchResults.map((u) => {
              const isSelected = selectedMembers.some((member) => member._id === u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => (groupOpen ? toggleMember(u) : startChat(u))}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {getAvatar(u.name, u.avatar)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  {groupOpen ? (
                    <span className={`ml-auto w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary-500 border-primary-400" : "border-slate-600"}`}>
                      {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                    </span>
                  ) : u.isOnline && <span className="ml-auto w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 01.8 1.6l-6.4 8.533V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.867L1.6 4.6A1 1 0 013 4z" />
          </svg>
          <input
            type="text"
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            placeholder="Filter your chats..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex border-b border-white/10 px-2">
        {["chats", "groups"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t ? "text-primary-300 border-primary-400" : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tab === "chats" ? (
          filteredConversations.length === 0 ? (
            <p className="text-center text-slate-600 text-sm mt-8 px-4">Search for users above to start chatting</p>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeChat?.id === conv._id;
              return (
                <button key={conv._id} onClick={() => setActiveChat("conversation", conv._id, conv)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center overflow-hidden">
                      {getAvatar(other?.name, other?.avatar)}
                    </div>
                    {other?.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-dark-900" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate">{other?.name}</p>
                      {conv.lastMessage && (
                        <span className="text-[11px] text-slate-500 flex-shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{renderConversationPreview(conv)}</p>
                      {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          <>
            <button
              onClick={() => setGroupOpen(true)}
              className="w-full text-left px-3 py-3 text-sm text-primary-300 hover:text-primary-200 font-semibold flex items-center gap-2 mb-1 rounded-xl hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Group
            </button>
            {filteredGroups.map((group) => {
              const isActive = activeChat?.id === group._id;
              return (
                <button key={group._id} onClick={() => setActiveChat("group", group._id, group)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {getAvatar(group.name, group.avatar)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{group.name}</p>
                    <p className="text-xs text-slate-500 truncate">{group.members?.length || 0} members</p>
                  </div>
                  {group.unreadCount > 0 && <span className="unread-badge">{group.unreadCount}</span>}
                </button>
              );
            })}
          </>
        )}
      </div>

      {groupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateGroup} className="w-full max-w-md glass-panel p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Create group</h2>
                <p className="text-xs text-slate-500">Find people, select members, then create.</p>
              </div>
              <button type="button" onClick={closeGroupModal} className="icon-button text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {groupError && <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{groupError}</div>}

            <div className="space-y-3">
              <input
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="input-field"
                placeholder="Group name"
              />
              <textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="input-field min-h-[86px] resize-none"
                placeholder="Short description"
              />
              <input
                value={search}
                onChange={handleSearch}
                className="input-field"
                placeholder="Search users to add"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-dark-950/70">
                {searchResults.map((u) => {
                  const isSelected = selectedMembers.some((member) => member._id === u._id);
                  return (
                    <button
                      type="button"
                      key={u._id}
                      onClick={() => toggleMember(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getAvatar(u.name, u.avatar)}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <span className={`ml-auto w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary-500 border-primary-400" : "border-slate-600"}`}>
                        {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 mb-2">Members</p>
              <div className="flex flex-wrap gap-2 min-h-10">
                {selectedMembers.length === 0 ? (
                  <span className="text-sm text-slate-600">No members selected yet</span>
                ) : selectedMembers.map((member) => (
                  <button
                    type="button"
                    key={member._id}
                    onClick={() => toggleMember(member)}
                    className="rounded-full bg-primary-500/15 border border-primary-400/30 px-3 py-1 text-xs text-primary-100"
                  >
                    {member.name} x
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isCreatingGroup} className="btn-primary w-full mt-5">
              {isCreatingGroup ? "Creating..." : "Create group"}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
