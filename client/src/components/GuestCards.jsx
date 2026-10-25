export default function GuestCards({ guests, rollingId, dark = false }) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {guests.map((g) => {
        const isRolling = rollingId === g._id;
        const base = dark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-gray-800 border-gray-200';
        const state = g.won
          ? 'bg-yellow-400 text-black border-yellow-200 shadow-lg shadow-yellow-500/40'
          : isRolling
          ? 'bg-pink-500 text-white border-pink-200 scale-105 shadow-lg shadow-pink-500/50'
          : base;
        return (
          <div
            key={g._id}
            className={`relative rounded-xl border p-3 text-center transition-all duration-100 ${state}`}
          >
            {g.won && (
              <span className="absolute -top-2 -right-2 rounded-full bg-black text-yellow-300 text-xs font-bold px-2 py-0.5">
                Round {g.wonRound}
              </span>
            )}
            <div className="text-2xl font-extrabold tracking-wide">{g.guestNumber}</div>
            <div className="text-sm truncate">{g.name}</div>
          </div>
        );
      })}
    </div>
  );
}