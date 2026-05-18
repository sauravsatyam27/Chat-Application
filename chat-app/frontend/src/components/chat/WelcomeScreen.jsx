export default function WelcomeScreen() {
  const features = [
    { label: "Realtime chat", value: "Socket powered" },
    { label: "Group rooms", value: "Create teams" },
    { label: "Files & media", value: "Share quickly" },
    { label: "Smart tools", value: "Search and star" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center bg-chat-pattern px-8">
      <div className="max-w-3xl w-full">
        <div className="glass-panel p-8 sm:p-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary-950/40">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Your conversations, organized.</h2>
          <p className="text-slate-400 max-w-xl">
            Pick a chat, search for someone new, or create a group from the sidebar. Your messages now include quick search, starred notes, file sharing, replies, typing status, and read receipts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {features.map((feature) => (
              <div key={feature.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">{feature.label}</p>
                <p className="text-xs text-slate-500 mt-1">{feature.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
