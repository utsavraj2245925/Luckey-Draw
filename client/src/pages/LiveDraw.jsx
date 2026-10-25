import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { playDrumRoll, playWinnerFanfare, resumeAudio } from '../hooks/useAudio';
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
  const end = Date.now() + 4000;
  const colors = ['#C8102E', '#D4AF37', '#FFD700', '#FF6B6B', '#4ECDC4'];
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Slot-machine style drum component
function SlotDrum({ spinning, finalNumber, spinData }) {
  const [displayNums, setDisplayNums] = useState(['?', '?', '?']);
  const intervalRef = useRef(null);
  const speedRef = useRef(80);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!spinning) {
      clearInterval(intervalRef.current);
      if (finalNumber) setDisplayNums([finalNumber, '', '']);
      return;
    }
    
    elapsedRef.current = 0;
    speedRef.current = 80;

    const tick = () => {
      const { start, end } = spinData || { start: 1, end: 999 };
      const r1 = Math.floor(Math.random() * (end - start + 1)) + start;
      const r2 = Math.floor(Math.random() * (end - start + 1)) + start;
      const r3 = Math.floor(Math.random() * (end - start + 1)) + start;
      setDisplayNums([r1, r2, r3]);
      elapsedRef.current += speedRef.current;
    };

    intervalRef.current = setInterval(tick, speedRef.current);

    const timer = setTimeout(() => {
      const stopBox = (index, delay) => {
        setTimeout(() => {
          setDisplayNums(prev => {
            const next = [...prev];
            next[index] = finalNumber || Math.floor(Math.random() * (spinData?.end - spinData?.start + 1)) + spinData?.start;
            return next;
          });
        }, delay);
      };

      stopBox(0, 0);
      stopBox(1, 400);
      stopBox(2, 800);
    }, 5500);

    return () => { 
      clearInterval(intervalRef.current); 
      clearTimeout(timer); 
    };
  }, [spinning, finalNumber, spinData]);

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
      {displayNums.map((n, i) => (
        <motion.div key={i}
          animate={spinning ? { scale: [1, 1.02, 1] } : { scale: [1, 1.08, 1] }}
          transition={spinning ? { duration: 0.1, repeat: Infinity } : { duration: 0.4 }}
          style={{
            width: 160, height: 160, borderRadius: 16,
            background: '#C8102E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(200,16,46,0.4)',
            border: `3px solid #fff`,
            filter: spinning ? 'blur(1px)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 900, color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            {n}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ProgressTracker({ currentRound, prevWinners }) {
  const completedRounds = prevWinners.length;
  const currentGroup = roundToGroup(currentRound);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const r = i + 1;
          const won = prevWinners.find(w => w.roundNo === r);
          const isActive = r === currentRound;
          const status = won ? 'done' : isActive ? 'active' : 'pending';

          return (
            <React.Fragment key={r}>
              <motion.div 
                animate={isActive ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px #C8102E', '0 0 15px #C8102E', '0 0 0px #C8102E'] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  background: status === 'done' ? '#52c41a' : status === 'active' ? '#C8102E' : '#e0e0e0',
                  color: status === 'pending' ? '#999' : '#fff',
                  border: `2px solid ${status === 'done' ? '#389e0d' : status === 'active' ? '#C8102E' : '#ccc'}`,
                  zIndex: 2,
                  cursor: 'pointer',
                }}
                title={won ? `R${r} - #${won.winnerNumber} - ${won.prize?.name || 'No Prize'}` : `Round ${r}`}
              >
                {status === 'done' ? '✓' : `R${r}`}
              </motion.div>
              {r < 9 && (
                <div style={{ 
                  width: 32, height: 4, 
                  background: r < currentRound ? '#52c41a' : (r === currentRound ? '#C8102E' : '#ddd'),
                  transition: 'background 0.5s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      <div style={{ textAlign: 'center', fontSize: 14, color: '#666', fontWeight: 500 }}>
        Round {currentRound} of 9  |  {GROUP_LABELS[currentGroup]}  |  {completedRounds} done, {9 - completedRounds} remaining
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
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Unlock audio on first interaction
  const unlockAudio = () => {
    resumeAudio();
    setAudioUnlocked(true);
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
    'game:spin_start': (data) => {
      setPhase('spinning');
      setWinner(null);
      setPrize(null);
      setSpinData(data);
      setCurrentRound(data.round);
      setCurrentGroup(data.group);
      setGameStarted(true);
      
      playDrumRoll(6000);
    },
    'game:winner_revealed': (data) => {
      setPhase('revealed');
      setWinner(data);
      setPrize(data.prize);
      setSpinData(null);
      playWinnerFanfare();
      fireConfetti();
      // Add to prev winners
      setPrevWinners(p => [...p.filter(w => w.roundNo !== data.roundNo), { roundNo: data.roundNo, group: data.group, winnerNumber: data.winnerNumber, prize: data.prize }]);
    },
    'game:next_round': ({ round, group }) => {
      setPhase('idle');
      setCurrentRound(round);
      setCurrentGroup(group);
      setWinner(null);
      setPrize(null);
    },
    'game:reset': () => {
      setPhase('idle'); setCurrentRound(1); setCurrentGroup(1);
      setWinner(null); setPrize(null); setPrevWinners([]); setGameStarted(false);
    },
    'game:completed': () => {
      setPhase('completed');
    },
  });

  // Fetch initial state
  useEffect(() => {
    fetch('/api/game/state').then(r => r.json()).then(({ state, winners }) => {
      if (state) {
        setCurrentRound(state.currentRound || 1);
        setCurrentGroup(roundToGroup(state.currentRound || 1));
        setGameStarted(state.isActive || false);
        setPhase(state.status || 'idle');
      }
      if (winners) {
        setPrevWinners(winners.map(w => ({
          roundNo: w.roundNo, group: w.group,
          serialNo: w.employee?.serialNo, name: w.employee?.name,
          department: w.employee?.department, prize: w.prize,
        })));
        if (winners.length > 0 && state?.status === 'revealed') {
          const last = winners[winners.length - 1];
          setWinner(last.employee);
          setPrize(last.prize);
        }
      }
    }).catch(() => {});
  }, []);

  const diyaStyle = { fontSize: 28, animation: 'flicker 0.8s ease-in-out infinite' };

  return (
    <div
      onClick={unlockAudio}
      style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8f0 0%, #fff0e6 40%, #fff5f0 100%)', fontFamily: '-apple-system, sans-serif', overflow: 'hidden' }}
    >
      {/* Top Header */}
      <div style={{ background: '#fff', borderBottom: '3px solid #C8102E', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(200,16,46,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={LOGO_PG} alt="PG" style={{ height: 48, objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: 1 }}>
            PG FORTUNE FIESTA 2026 
          </h1>
          <span style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a',  letterSpacing: 1 }}>
             💥 The Lucky Legends 💥
          </span>
          {/* <p style={{ margin: 0, fontSize: 13, color: '#888', marginTop: 2 }}>PG Group — Celebrating Together</p> */}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={diyaStyle}>🪔</span>
          <span style={{ ...diyaStyle, animationDelay: '0.3s' }}>🪔</span>
          <span style={{ ...diyaStyle, animationDelay: '0.6s' }}>🪔</span>
        </div>
      </div>

      {/* Round indicators */}
      <ProgressTracker currentRound={currentRound} prevWinners={prevWinners} />


      {/* Main Stage */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 0', gap: 20 }}>

        {/* Group Banner */}
        {gameStarted && (
          <motion.div
            key={currentRound}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: GROUP_BG[currentGroup], border: `2px solid ${GROUP_COLORS[currentGroup]}`,
              borderRadius: 12, padding: '10px 32px', textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: GROUP_COLORS[currentGroup] }}>
              {GROUP_LABELS[currentGroup]} &nbsp;·&nbsp; Round {currentRound} of 9
            </span>
          </motion.div>
        )}

        {/* Drum / Spin Area */}
        {(gameStarted || phase === 'spinning') && (phase === 'spinning' || phase === 'idle') && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <motion.p 
              animate={phase === 'spinning' ? { opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] } : {}} 
              transition={{ duration: 1, repeat: Infinity }}
              style={{ color: '#888', fontSize: 18, marginBottom: 16, fontWeight: 600 }}
            >
              {phase === 'spinning' ? '🎰 Drawing...' : '⏳ Waiting for Admin to Spin'}
            </motion.p>
            <SlotDrum
              spinning={phase === 'spinning'}
              finalNumber={winner?.winnerNumber}
              spinData={spinData}
            />
          </div>
        )}

        {/* WINNER REVEAL */}
        <AnimatePresence>
          {phase === 'revealed' && winner && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                background: '#fff',
                border: '4px solid #D4AF37',
                borderRadius: 24,
                padding: '32px 48px',
                textAlign: 'center',
                boxShadow: '0 0 60px rgba(212,175,55,0.4), 0 20px 60px rgba(0,0,0,0.1)',
                maxWidth: 600,
                width: '100%',
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                Round {currentRound} Winner
              </div>

              {/* Big Card Number */}
              <div style={{
                fontSize: 96, fontWeight: 900, fontFamily: 'Georgia, serif',
                background: 'linear-gradient(135deg, #D4AF37, #FFD700, #D4AF37)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1, marginBottom: 12,
              }}>
                #{winner.winnerNumber}
              </div>

              <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
                Congratulations!
              </div>
              <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
                Please come to the stage 🎉
              </div>

              {prize && (
                <div style={{
                  background: 'linear-gradient(135deg, #C8102E, #8b0000)',
                  borderRadius: 12, padding: '14px 24px', marginTop: 8,
                }}>
                  <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Prize</div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>{prize.name}</div>
                  {prize.description && <div style={{ color: '#ffcdd2', fontSize: 14, marginTop: 4 }}>{prize.description}</div>}
                  {prize.imageUrl && <img src={prize.imageUrl} alt={prize.name} style={{ maxHeight: 80, marginTop: 12, objectFit: 'contain', borderRadius: 8 }} />}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* IDLE / Not started */}
        {!gameStarted && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <img src={LOGO_ONLY} alt="PG" style={{ height: 100, objectFit: 'contain', marginBottom: 24, opacity: 0.8 }} />
            <h2 style={{ fontSize: 24, color: '#C8102E', fontFamily: 'Georgia, serif' }}>Waiting for Game to Start...</h2>
            <p style={{ color: '#888', marginTop: 8 }}>Admin will begin the lucky draw shortly</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              {['🪔','✨','🎊','✨','🪔'].map((e, i) => <span key={i} style={{ fontSize: 28 }}>{e}</span>)}
            </div>
          </div>
        )}

        {/* COMPLETED */}
        {phase === 'completed' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 64 }}>🎊</div>
            <h2 style={{ fontSize: 32, color: '#C8102E', fontFamily: 'Georgia, serif' }}>Lucky Draw Complete!</h2>
            <p style={{ color: '#555', marginTop: 8 }}>All 9 rounds have been drawn. Congratulations to all winners!</p>
          </motion.div>
        )}

        {/* Previous Winners Strip */}
        {prevWinners.length > 0 && (
          <div style={{ width: '100%', maxWidth: 900 }}>
            <h3 style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 10, letterSpacing: 1 }}>PREVIOUS WINNERS</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {prevWinners.map(w => (
                <div key={w.roundNo} style={{
                  background: '#fff', border: `1px solid ${GROUP_COLORS[w.group]}`,
                  borderRadius: 10, padding: '8px 14px', fontSize: 13, textAlign: 'center',
                  minWidth: 110,
                }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>R{w.roundNo}</div>
                  <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: 18 }}>#{w.winnerNumber}</div>
                  {w.prize && <div style={{ fontSize: 11, color: '#C8102E', marginTop: 2 }}>{w.prize.name}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decorative bottom */}
        <div style={{ textAlign: 'center', padding: '12px 0 24px', color: '#ccc', fontSize: 12 }}>
          🪔 PG Group — Grand Diwali Lucky Draw 2024 🪔
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
