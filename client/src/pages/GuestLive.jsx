import useGuestDraw from '../hooks/useGuestDraw';
import GuestCards from '../components/GuestCards';

export default function GuestLive() {
  const { guests, state, rolling, spinning, justWon } = useGuestDraw();
  const done = state.roundsDone >= state.maxRounds;
  const roundLabel = done ? 'Draw Complete' : `Round ${state.roundsDone + (spinning ? 1 : 1)} of ${state.maxRounds}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6">
      <h1 className="text-center text-4xl font-extrabold mb-1">Guest Lucky Draw</h1>
      <p className="text-center text-lg text-yellow-300 mb-6">{roundLabel}</p>

      {/* Main display */}
      <div className="mx-auto max-w-3xl rounded-3xl bg-white/10 border border-white/20 p-8 text-center mb-6">
        {rolling ? (
          <>
            <div className={`text-8xl font-black ${justWon ? 'text-yellow-300 animate-pulse' : ''}`}>
              {rolling.guestNumber}
            </div>
            <div className="text-4xl mt-2">{rolling.name}</div>
            {justWon && <div className="mt-3 text-2xl text-yellow-300">🎉 Round {justWon.wonRound} Winner! 🎉</div>}
          </>
        ) : (
          <div className="text-3xl text-white/70 py-8">
            {guests.length ? 'Waiting for the spin…' : 'No guests uploaded yet'}
          </div>
        )}
      </div>

      {/* Winner slots */}
      <div className="mx-auto max-w-3xl grid grid-cols-3 gap-3 mb-8">
        {Array.from({ length: state.maxRounds }, (_, i) => {
          const w = state.winners.find((x) => x.wonRound === i + 1);
          return (
            <div
              key={i}
              className={`rounded-xl p-4 text-center border ${
                w ? 'bg-yellow-400 text-black border-yellow-200' : 'bg-white/5 border-white/20 text-white/50'
              }`}
            >
              <div className="text-xs uppercase tracking-wider">Round {i + 1}</div>
              {w ? (
                <>
                  <div className="text-3xl font-black">{w.guestNumber}</div>
                  <div className="truncate">{w.name}</div>
                </>
              ) : (
                <div className="text-3xl font-black">—</div>
              )}
            </div>
          );
        })}
      </div>

      <GuestCards guests={guests} rollingId={spinning ? rolling?._id : null} dark />
    </div>
  );
}