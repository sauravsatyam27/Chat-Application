export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-dark-950">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary-600/30">
          <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
        <p className="text-slate-500 max-w-xs mx-auto">
          Select a conversation from the sidebar or search for a user to start chatting.
        </p>
        <div className="flex items-center justify-center gap-6 mt-8 text-slate-600 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Real-time messaging
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
            Group chats
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            File sharing
          </div>
        </div>
      </div>
    </div>
  );
}
