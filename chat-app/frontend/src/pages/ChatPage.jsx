import { useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import useChatStore from "../context/chatStore";
import Sidebar from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import WelcomeScreen from "../components/chat/WelcomeScreen";

export default function ChatPage() {
  useSocket(); // Initialize socket listeners

  const { fetchConversations, fetchGroups, activeChat } = useChatStore();

  useEffect(() => {
    fetchConversations();
    fetchGroups();
  }, []);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <div className={`${activeChat ? "hidden md:flex" : "flex"} h-full`}>
        <Sidebar />
      </div>
      <main className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {activeChat ? <ChatWindow /> : <WelcomeScreen />}
      </main>
    </div>
  );
}
