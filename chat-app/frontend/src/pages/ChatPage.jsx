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
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {activeChat ? <ChatWindow /> : <WelcomeScreen />}
      </main>
    </div>
  );
}
