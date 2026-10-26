import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { playDrumRoll, playWinnerFanfare, playGameStartSound, resumeAudio } from '../hooks/useAudio';
import confetti from 'canvas-confetti';

const LOGO_PG = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png';
const LOGO_ONLY = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom+(1).png';

const GROUP_LABELS = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
const GROUP_COLORS = { 1: '#3b82f6', 2: '#8b5cf6', 3: '#10b981' };
const GROUP_BG = { 1: '#eff6ff', 2: '#f5f3ff', 3: '#ecfdf5' };

function roundToGroup(r) {
  if (r <= 3) return 1;
  if (r <= 6) return 2;
  return 3;
}

function fireConfetti() {
  const end = Date.now() + 5000;
  const colors = ['#C8102E', '#D4AF37', '#FFD700', '#FF6B6B', '#4ECDC4', '#52c41a'];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// 10-Second Slot Drum Animation for Employee Codes
function SlotDrum({ spinning, winnerCode, sampleCodes }) {
  const [displayCode, setDisplayCode] = useState('?????????');
  const [chars, setChars] = useState(Array(8).fill('?'));
  const [secondsLeft, setSecondsLeft] = useState(10);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!spinning) {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      if (winnerCode) {
        setDisplayCode(winnerCode);
        setChars(winnerCode.split(''));
      }
      return;
    }

    setSecondsLeft(10);
    const codes = (sampleCodes && sampleCodes.length > 0)
      ? sampleCodes
      : ['PG100086', 'PG100277', 'PT200016', 'PT200034', 'PG400003', 'PG300017', 'PT200042', 'PT200066'];

    // Countdown timer for 10 seconds
    const startT = Date.now();
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, 10 - Math.floor((Date.now() - startT) / 1000));
      setSecondsLeft(remaining);
    }, 200);

    // Rapid code cycling
    let tickCount = 0;
    const cycle = () => {
      const elapsed = Date.now() - startT;
      const progress = elapsed / 10000;

      // Pick random code from list
      const randomCode = codes[Math.floor(Math.random() * codes.length)] || 'PG100086';
      setDisplayCode(randomCode);
      setChars(randomCode.split(''));

      tickCount++;
      // Gradually adjust speed: fast first 7 seconds, slight deceleration in final 3 seconds
      const speed = progress < 0.75 ? 60 : Math.min(250, 60 + (progress - 0.75) * 600);
      if (elapsed < 9800) {
        intervalRef.current = setTimeout(cycle, speed);
      }
    };

    cycle();

    return () => {
      clearTimeout(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [spinning, winnerCode, sampleCodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {spinning && (
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#C8102E',
            letterSpacing: 2,
            background: '#fff0f0',
            padding: '6px 24px',
            borderRadius: 30,
            border: '2px solid #C8102E',
          }}
        >
          ⏱️ DRAWING WINNER... {secondsLeft}s
        </motion.div>
      )}

      {/* Futuristic Slot Drum Reel for Employee Code */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.85)',
          padding: '24px 32px',
          borderRadius: 24,
          boxShadow: '0 16px 48px rgba(200,16,46,0.2)',
          border: '3px solid #D4AF37',
        }}
      >
        {chars.map((char, i) => (
          <motion.div
            key={i}
            animate={spinning ? { y: [-8, 8, -8], scale: [1, 1.03, 1] } : { y: 0, scale: [1, 1.06, 1] }}
            transition={spinning ? { duration: 0.12, repeat: Infinity, delay: i * 0.02 } : { duration: 0.4 }}
            style={{
              width: 68,
              height: 94,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #C8102E 0%, #8b0000 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(200,16,46,0.35), inset 0 2px 4px rgba(255,255,255,0.4)',
              border: '2px solid #FFD700',
              filter: spinning ? 'blur(0.5px)' : 'none',
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'Impact, Arial Black, sans-serif',
                letterSpacing: 1,
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {char}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Progress tracker across all 9 rounds
function ProgressTracker({ currentRound, prevWinners }) {
  const completedRounds = prevWinners.length;
  const currentGroup = roundToGroup(currentRound);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const r = i + 1;
          const won = prevWinners.find(w => w.roundNo === r);
          const isActive = r === currentRound;
          const status = won ? 'done' : isActive ? 'active' : 'pending';

          return (
            <React.Fragment key={r}>
              <motion.div
                animate={isActive ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0px #C8102E', '0 0 16px #C8102E', '0 0 0px #C8102E'] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  background: status === 'done' ? '#52c41a' : status === 'active' ? '#C8102E' : '#e5e7eb',
                  color: status === 'pending' ? '#9ca3af' : '#fff',
                  border: `2px solid ${status === 'done' ? '#389e0d' : status === 'active' ? '#C8102E' : '#d1d5db'}`,
                  zIndex: 2,
                  cursor: 'default',
                }}
                title={won ? `R${r} - ${won.winnerNumber} - ${won.prize?.name || ''}` : `Round ${r}`}
              >
                {status === 'done' ? '✓' : `R${r}`}
              </motion.div>
              {r < 9 && (
                <div
                  style={{
                    width: 34,
                    height: 4,
                    background: r < currentRound ? '#52c41a' : r === currentRound ? '#C8102E' : '#e5e7eb',
                    transition: 'background 0.5s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: 14, color: '#666', fontWeight: 600 }}>
        Round {currentRound} of 9 &nbsp;|&nbsp; <span style={{ color: GROUP_COLORS[currentGroup] }}>{GROUP_LABELS[currentGroup]}</span> &nbsp;|&nbsp; {completedRounds} Drawn, {9 - completedRounds} Remaining
      </div>
    </div>
  );
}

export default function LiveDraw() {
  const [phase, setPhase] = useState('idle'); // idle | spinning | revealed | completed
  const [currentRound, setCurrentRound] = useState(1);
  const [currentGroup, setCurrentGroup] = useState(1);
  const [winner, setWinner] = useState(null);
  const [prize, setPrize] = useState(null);
  const [spinData, setSpinData] = useState(null);
  const [prevWinners, setPrevWinners] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const toggleSound = () => {
    resumeAudio();
    setSoundEnabled(p => !p);
  };

  useSocket({
    'game:state': ({ state }) => {
      if (state) {
        setCurrentRound(state.currentRound || 1);
        setCurrentGroup(roundToGroup(state.currentRound || 1));
        setGameStarted(state.isActive || false);
        if (state.status === 'idle' || state.status === 'revealed') setPhase(state.status);
      }
    },
    'game:start': () => {
      setGameStarted(true);
      setPhase('idle');
      if (soundEnabled) playGameStartSound();
    },
    'game:spin_start': (data) => {
      setPhase('spinning');
      setWinner(null);
      setPrize(null);
      setSpinData(data);
      setCurrentRound(data.round);
      setCurrentGroup(data.group);
      setGameStarted(true);

      if (soundEnabled) {
        playDrumRoll(data.duration || 10000);
      }
    },
    'game:winner_revealed': (data) => {
      setPhase('revealed');
      setWinner(data);
      setPrize(data.prize);
      setSpinData(null);

      if (soundEnabled) {
        playWinnerFanfare();
      }
      fireConfetti();

      // Update previous winners
      setPrevWinners(prev => [
        ...prev.filter(w => w.roundNo !== data.roundNo),
        {
          roundNo: data.roundNo,
          group: data.group,
          winnerNumber: data.winnerNumber || data.employeeCode,
          employee: data.employee,
          prize: data.prize,
        },
      ]);
    },
    'game:next_round': ({ round, group }) => {
      setPhase('idle');
      setCurrentRound(round);
      setCurrentGroup(group);
      setWinner(null);
      setPrize(null);
    },
    'game:reset': () => {
      setPhase('idle');
      setCurrentRound(1);
      setCurrentGroup(1);
      setWinner(null);
      setPrize(null);
      setPrevWinners([]);
      setGameStarted(false);
    },
    'game:completed': () => {
      setPhase('completed');
    },
  });

  // Fetch initial state
  useEffect(() => {
    fetch('/api/game/state', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` },
    })
      .then(r => r.json())
      .then(({ state, winners }) => {
        if (state) {
          setCurrentRound(state.currentRound || 1);
          setCurrentGroup(roundToGroup(state.currentRound || 1));
          setGameStarted(state.isActive || false);
          setPhase(state.status || 'idle');
        }
        if (winners) {
          setPrevWinners(
            winners.map(w => ({
              roundNo: w.roundNo,
              group: w.group,
              winnerNumber: w.winnerNumber || w.employeeCode,
              employee: w.employee,
              prize: w.prize,
            }))
          );
          if (winners.length > 0 && state?.status === 'revealed') {
            const last = winners[winners.length - 1];
            setWinner({
              winnerNumber: last.winnerNumber || last.employeeCode,
              employeeCode: last.employeeCode,
              employee: last.employee,
            });
            setPrize(last.prize);
          }
        }
      })
      .catch(() => {});
  }, []);

  const diyaStyle = { fontSize: 28, animation: 'flicker 0.8s ease-in-out infinite' };

  return (
    <div
      onClick={resumeAudio}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #fff9f0 0%, #fff1e6 45%, #fff7f2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '3px solid #C8102E',
          padding: '12px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 14px rgba(200,16,46,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={LOGO_PG} alt="PG" style={{ height: 48, objectFit: 'contain' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 900,
              color: '#1a1a1a',
              fontFamily: 'Georgia, serif',
              letterSpacing: 1,
            }}
          >
            PG FORTUNE FIESTA 2026
          </h1>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#C8102E', marginTop: 2 }}>
            💥 The Lucky Legends 💥
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={toggleSound}
            style={{
              background: soundEnabled ? '#f6ffed' : '#fff1f0',
              border: `1.5px solid ${soundEnabled ? '#52c41a' : '#ff4d4f'}`,
              color: soundEnabled ? '#389e0d' : '#cf1322',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {soundEnabled ? '🔊 Sound: ON' : '🔈 Sound: MUTED'}
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={diyaStyle}>🪔</span>
            <span style={{ ...diyaStyle, animationDelay: '0.3s' }}>🪔</span>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div style={{ padding: '16px 20px 0' }}>
        <ProgressTracker currentRound={currentRound} prevWinners={prevWinners} />
      </div>

      {/* Main Stage */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 24px 30px', gap: 20 }}>
        {/* Active Group Banner */}
        {gameStarted && (
          <motion.div
            key={currentRound}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: GROUP_BG[currentGroup],
              border: `2px solid ${GROUP_COLORS[currentGroup]}`,
              borderRadius: 30,
              padding: '8px 28px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: GROUP_COLORS[currentGroup] }}>
              🎯 {GROUP_LABELS[currentGroup]} &nbsp;·&nbsp; Round {currentRound} of 9
            </span>
          </motion.div>
        )}

        {/* 10-Second Drum Animation */}
        {(gameStarted || phase === 'spinning') && (phase === 'spinning' || phase === 'idle') && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ color: '#777', fontSize: 18, marginBottom: 18, fontWeight: 700 }}>
              {phase === 'spinning' ? '🎰 Drum Rolling for 10 Seconds...' : '⏳ Ready — Waiting for Admin to Spin'}
            </p>
            <SlotDrum
              spinning={phase === 'spinning'}
              winnerCode={winner?.winnerNumber || winner?.employeeCode}
              sampleCodes={spinData?.sampleCodes}
            />
          </div>
        )}

        {/* SLOW, SUSPENSEFUL WINNER REVEAL */}
        <AnimatePresence>
          {phase === 'revealed' && winner && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{
                background: '#ffffff',
                border: '4px solid #D4AF37',
                borderRadius: 24,
                padding: '36px 44px',
                textAlign: 'center',
                boxShadow: '0 0 70px rgba(212,175,55,0.45), 0 24px 60px rgba(0,0,0,0.12)',
                maxWidth: 640,
                width: '100%',
              }}
            >
              <div style={{ fontSize: 50, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 14, color: '#C8102E', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800 }}>
                Round {currentRound} • Lucky Winner
              </div>

              {/* Step 1: Winner Employee ID Code (Immediate at 10s) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  background: 'linear-gradient(135deg, #C8102E 0%, #D4AF37 60%, #8b0000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  margin: '12px 0 8px',
                  letterSpacing: 2,
                }}
              >
                #{winner.winnerNumber || winner.employeeCode}
              </motion.div>

              {/* Step 2: Employee Name (Slow reveal: +0.9s delay) */}
              {winner.employee?.name && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#1a1a1a',
                    fontFamily: 'Georgia, serif',
                    marginTop: 6,
                    marginBottom: 4,
                  }}
                >
                  {winner.employee.name}
                </motion.div>
              )}

              {/* Step 3 & 4: Department & Current Unit (Slow reveal: +1.8s delay) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 10,
                  flexWrap: 'wrap',
                }}
              >
                {winner.employee?.department && (
                  <span
                    style={{
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: 16,
                      padding: '6px 16px',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#374151',
                    }}
                  >
                    🏢 Department: <b>{winner.employee.department}</b>
                  </span>
                )}
                {winner.employee?.unit && (
                  <span
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #93c5fd',
                      borderRadius: 16,
                      padding: '6px 16px',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#1d4ed8',
                    }}
                  >
                    🏭 Unit: <b>{winner.employee.unit}</b>
                  </span>
                )}
              </motion.div>

              {/* Step 5: Prize Details (Slow reveal: +2.7s delay) */}
              {prize && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.7, duration: 0.8 }}
                  style={{
                    background: 'linear-gradient(135deg, #C8102E, #8b0000)',
                    borderRadius: 16,
                    padding: '16px 28px',
                    marginTop: 20,
                    boxShadow: '0 8px 24px rgba(200,16,46,0.35)',
                    border: '2px solid #FFD700',
                  }}
                >
                  <div style={{ color: '#FFD700', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                    🎁 WON PRIZE
                  </div>
                  <div style={{ color: '#fff', fontSize: 26, fontWeight: 900 }}>
                    {prize.name}
                  </div>
                  {prize.description && (
                    <div style={{ color: '#fed7aa', fontSize: 14, marginTop: 4 }}>
                      {prize.description}
                    </div>
                  )}
                  {prize.imageUrl && (
                    <img
                      src={prize.imageUrl}
                      alt={prize.name}
                      style={{ maxHeight: 90, marginTop: 12, objectFit: 'contain', borderRadius: 8 }}
                    />
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not started */}
        {!gameStarted && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <img src={LOGO_ONLY} alt="PG" style={{ height: 100, objectFit: 'contain', marginBottom: 20, opacity: 0.85 }} />
            <h2 style={{ fontSize: 26, color: '#C8102E', fontFamily: 'Georgia, serif' }}>
              Waiting for Game to Start...
            </h2>
            <p style={{ color: '#888', marginTop: 6, fontSize: 15 }}>
              Admin will begin the PG Fortune Fiesta Lucky Draw shortly.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              {['🪔', '✨', '🎊', '✨', '🪔'].map((e, i) => (
                <span key={i} style={{ fontSize: 32 }}>{e}</span>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {phase === 'completed' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', padding: '36px 0' }}
          >
            <div style={{ fontSize: 72 }}>🎊</div>
            <h2 style={{ fontSize: 36, color: '#C8102E', fontFamily: 'Georgia, serif' }}>
              Lucky Draw Complete!
            </h2>
            <p style={{ color: '#555', marginTop: 8, fontSize: 18 }}>
              All 9 rounds have concluded. Heartiest Congratulations to all winners!
            </p>
          </motion.div>
        )}

        {/* Previous Winners Strip */}
        {prevWinners.length > 0 && (
          <div style={{ width: '100%', maxWidth: 940, marginTop: 10 }}>
            <h3 style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 10, letterSpacing: 1.5, fontWeight: 700 }}>
              PREVIOUS WINNERS
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {prevWinners.map(w => (
                <div
                  key={w.roundNo}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${GROUP_COLORS[w.group]}`,
                    borderRadius: 12,
                    padding: '8px 14px',
                    fontSize: 13,
                    textAlign: 'center',
                    minWidth: 120,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>R{w.roundNo} · Grp {['A','B','C'][w.group-1]}</div>
                  <div style={{ fontWeight: 900, color: '#C8102E', fontSize: 16, margin: '2px 0' }}>
                    #{w.winnerNumber}
                  </div>
                  {w.employee?.name && (
                    <div style={{ fontSize: 11, color: '#333', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                      {w.employee.name}
                    </div>
                  )}
                  {w.prize?.name && (
                    <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, marginTop: 2 }}>
                      🎁 {w.prize.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px 0 20px', color: '#999', fontSize: 13 }}>
          🪔 PG Group — Grand Diwali Fortune Fiesta 2026 🪔
        </div>
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
