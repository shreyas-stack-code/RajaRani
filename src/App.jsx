import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { fbGet, fbSet, fbPatch, fbDelete } from './firebase';
import RoleSvg from './components/RoleSvg';
import BackgroundDoodles from './components/BackgroundDoodles';

const ALL_ROLES = ['Raja', 'Rani', 'Mantri', 'Milkman', 'Postman', 'Guard', 'Police', 'Thief'];
const ROLE_DATA = {
  Raja:     { emoji: '♚', pts: 1000, desc: 'Find the Rani to earn 1000 pts!' },
  Rani:     { emoji: '♛', pts: 800, desc: 'Find the Mantri to earn 800 pts!' },
  Mantri:   { emoji: '⚜', pts: 600, desc: 'Find the Milkman to earn 600 pts!' },
  Milkman:  { emoji: '🥛', pts: 500, desc: 'Find the Postman to earn 500 pts!' },
  Postman:  { emoji: '✉', pts: 300, desc: 'Find the Guard to earn 300 pts!' },
  Guard:    { emoji: '🛡️', pts: 250, desc: 'Find the Police to earn 250 pts!' },
  Police:   { emoji: '⚔️', pts: 400, desc: 'Find the Thief to earn 400 pts!' },
  Thief:    { emoji: '🗡️', pts: 0, desc: 'You are the Thief — stay hidden!' }
};

const AVTR = ['🎭','🃏','🎲','🎯','🎪','🎨','🔮','🔱'];
const CLRS = ['#ebd2c8', '#ccd9e8', '#c5d3c1', '#d7cedf', '#ebdcb9', '#e8d1e5', '#c2e2e4', '#e5e8d1'];

const BOWL_CHIT_POSITIONS = [
  { x: 30, y: 72, rot: -12 },
  { x: 100, y: 74, rot: 15 },
  { x: 65, y: 75, rot: 5 },
  { x: 45, y: 62, rot: -25 },
  { x: 85, y: 64, rot: 20 },
  { x: 65, y: 55, rot: -3 },
  { x: 35, y: 50, rot: 35 },
  { x: 95, y: 52, rot: -40 }
];

const SCATTERED_CHIT_POSITIONS = [
  { x: '15%', y: '25%', rot: -15 },
  { x: '45%', y: '15%', rot: 8 },
  { x: '75%', y: '20%', rot: -22 },
  { x: '20%', y: '60%', rot: 25 },
  { x: '50%', y: '55%', rot: -5 },
  { x: '80%', y: '65%', rot: 18 },
  { x: '35%', y: '40%', rot: -10 },
  { x: '65%', y: '45%', rot: 12 }
];

function activeRoles(n) {
  const roleSets = {
    2: ['Raja', 'Thief'],
    3: ['Raja', 'Police', 'Thief'],
    4: ['Raja', 'Rani', 'Police', 'Thief'],
    5: ['Raja', 'Rani', 'Mantri', 'Police', 'Thief'],
    6: ['Raja', 'Rani', 'Mantri', 'Milkman', 'Police', 'Thief'],
    7: ['Raja', 'Rani', 'Mantri', 'Milkman', 'Postman', 'Police', 'Thief'],
    8: ['Raja', 'Rani', 'Mantri', 'Milkman', 'Postman', 'Guard', 'Police', 'Thief']
  };
  return roleSets[n] || roleSets[8];
}

function roleSeeks(roles, role) {
  const i = roles.indexOf(role);
  if (i === -1 || i === roles.length - 1) return null;
  return roles[i + 1];
}

function isLastRole(roles, role) {
  return roles[roles.length - 1] === role;
}

function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

function ensureHistory(players, roundNum) {
  const rIdx = roundNum - 1;
  players.forEach(p => {
    if (!p.history) p.history = [];
    for (let i = 0; i <= rIdx; i++) {
      if (p.history[i] === undefined) {
        p.history[i] = 0;
      }
    }
  });
}

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 }
  });
}

function triggerRevealConfetti() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

export default function App() {
  // Session / Player State
  const [myId] = useState(() => {
    const savedId = sessionStorage.getItem('raja_rani_player_id');
    if (savedId) return savedId;
    const newId = 'p' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('raja_rani_player_id', newId);
    return newId;
  });

  const [name, setName] = useState('');
  const [myName, setMyName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  
  // Lobby State
  const [joinCode, setJoinCode] = useState('');
  const [lobbyError, setLobbyError] = useState('');
  const [notification, setNotification] = useState('');
  
  // Game state
  const [isChitUnfolded, setIsChitUnfolded] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isPickLocked, setIsPickLocked] = useState(false);

  // Local shuffling animation tracking
  const [localShuffling, setLocalShuffling] = useState(false);
  const [lastShuffledRound, setLastShuffledRound] = useState(0);

  // Refs for tracking changes
  const prevPhaseRef = useRef('');
  const prevRoomDataRef = useRef(null);
  const chatEndRef = useRef(null);

  // Restore session
  useEffect(() => {
    const savedRoom = sessionStorage.getItem('raja_rani_room_code');
    const savedName = sessionStorage.getItem('raja_rani_name');
    if (savedRoom && savedName) {
      setName(savedName);
      setMyName(savedName);
      setRoomCode(savedRoom);
    }
  }, []);

  // Sync session storage
  useEffect(() => {
    if (roomCode && myName) {
      sessionStorage.setItem('raja_rani_room_code', roomCode);
      sessionStorage.setItem('raja_rani_name', myName);
    } else {
      sessionStorage.removeItem('raja_rani_room_code');
    }
  }, [roomCode, myName]);

  // Polling Realtime Database
  useEffect(() => {
    if (!roomCode) return;

    let active = true;
    const pollInterval = setInterval(async () => {
      try {
        const data = await fbGet('rooms/' + roomCode);
        if (!active) return;
        
        if (!data) {
          showNotification('Room closed.');
          setRoomCode('');
          setRoomData(null);
          return;
        }

        const me = (data.players || []).find(p => p.id === myId);
        if (!me) {
          showNotification('You were removed or left the room.');
          setRoomCode('');
          setRoomData(null);
          return;
        }

        setRoomData(data);
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 900);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [roomCode, myId]);

  // Local shuffling visual transition
  useEffect(() => {
    if (roomData && roomData.phase === 'shuffling') {
      const round = roomData.round || 1;
      if (lastShuffledRound !== round) {
        setLocalShuffling(true);
        setLastShuffledRound(round);
        const timer = setTimeout(() => {
          setLocalShuffling(false);
        }, 2800);
        return () => clearTimeout(timer);
      }
    }
  }, [roomData, lastShuffledRound]);

  // Confetti triggers and chat updates
  useEffect(() => {
    if (roomData) {
      const currentPhase = roomData.phase;
      const prevPhase = prevPhaseRef.current;
      
      if (currentPhase === 'reveal' && prevPhase !== 'reveal') {
        triggerRevealConfetti();
      }
      
      if (currentPhase === 'playing') {
        const prevFound = prevPhase === 'playing' ? (prevRoomDataRef.current?.stage?.foundIds || []) : [];
        const currentFound = roomData.stage?.foundIds || [];
        if (currentFound.length > prevFound.length) {
          triggerConfetti();
        }
      }
      
      prevPhaseRef.current = currentPhase;
      prevRoomDataRef.current = roomData;
    } else {
      prevPhaseRef.current = '';
      prevRoomDataRef.current = null;
    }
  }, [roomData]);

  // Scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [roomData?.chat]);

  const showNotification = (msg, dur = 3000) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), dur);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    showNotification('Code copied to clipboard!');
  };

  // Lobby actions
  const createRoom = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setLobbyError('Enter your name first.'); return; }
    
    const firebaseHostUrl = import.meta.env.VITE_FIREBASE_URL;
    if (!firebaseHostUrl) {
      setLobbyError('Firebase URL is not configured. Please add VITE_FIREBASE_URL in your Vercel/local env.');
      return;
    }
    
    const code = genCode();
    const data = {
      code,
      host: myId,
      phase: 'waiting',
      players: [{ id: myId, name: trimmedName, color: CLRS[0], avatar: AVTR[0], score: 0, history: [] }],
      roles: {},
      stage: { seekerId: null, seeking: null, foundIds: [] },
      chits: [],
      chat: [{ sys: true, text: `Room created! Share code ${code} with friends.` }],
      round: 1
    };
    try {
      setLobbyError('');
      await fbSet('rooms/' + code, data);
      setMyName(trimmedName);
      setRoomCode(code);
      setRoomData(data);
    } catch (e) {
      setLobbyError('Connection failed. Verify Firebase configuration.');
    }
  };

  const joinRoom = async () => {
    const trimmedName = name.trim();
    const code = joinCode.trim().toUpperCase();
    if (!trimmedName) { setLobbyError('Enter your name.'); return; }
    if (!code) { setLobbyError('Enter a room code.'); return; }
    
    const firebaseHostUrl = import.meta.env.VITE_FIREBASE_URL;
    if (!firebaseHostUrl) {
      setLobbyError('Firebase URL is not configured. Please add VITE_FIREBASE_URL in your Vercel/local env.');
      return;
    }
    
    try {
      setLobbyError('');
      const data = await fbGet('rooms/' + code);
      if (!data) { setLobbyError('Room not found!'); return; }
      if (data.phase !== 'waiting') { setLobbyError('Game already started.'); return; }
      
      const players = data.players || [];
      if (players.length >= 8) { setLobbyError('Room is full (8/8).'); return; }
      
      // Add if not already joined
      const existingIdx = players.findIndex(p => p.id === myId);
      if (existingIdx === -1) {
        const idx = players.length;
        players.push({ id: myId, name: trimmedName, color: CLRS[idx], avatar: AVTR[idx], score: 0, history: [] });
        const chat = data.chat || [];
        chat.push({ sys: true, text: `${trimmedName} joined the court!` });
        await fbPatch('rooms/' + code, { players, chat });
      } else {
        // Just update name/metadata if already present
        players[existingIdx].name = trimmedName;
        await fbPatch('rooms/' + code, { players });
      }
      
      setMyName(trimmedName);
      setRoomCode(code);
      setRoomData(data);
    } catch (e) {
      setLobbyError('Connection failed.');
    }
  };

  const leaveRoom = async () => {
    const code = roomCode;
    setRoomCode('');
    setRoomData(null);
    setIsChitUnfolded(false);
    
    if (!code) return;
    try {
      const data = await fbGet('rooms/' + code);
      if (data) {
        const players = (data.players || []).filter(p => p.id !== myId);
        if (players.length === 0) {
          await fbDelete('rooms/' + code);
        } else {
          ensureHistory(players, data.round || 1);
          const host = data.host === myId ? players[0].id : data.host;
          const chat = data.chat || [];
          chat.push({ sys: true, text: `${myName} left the court.` });

          const leavingRole = data.roles?.[myId];
          const roles = { ...(data.roles || {}) };
          delete roles[myId];

          let stage = data.stage || {};
          if (data.phase === 'playing' && leavingRole) {
            const oldChain = [...(stage.activeRoles || [])];
            const newChain = oldChain.filter(r => r !== leavingRole);
            stage.activeRoles = newChain;

            if (stage.seekerId === myId) {
              const nextRole = stage.seeking;
              const nextSeekerId = Object.keys(roles).find(id => roles[id] === nextRole);

              if (nextSeekerId) {
                stage.seekerId = nextSeekerId;
                const idx = newChain.indexOf(nextRole);
                stage.seeking = (idx !== -1 && idx < newChain.length - 1) ? newChain[idx + 1] : null;

                const nextPlayer = players.find(p => p.id === nextSeekerId);
                chat.push({
                  sys: true,
                  text: `${nextPlayer?.name || 'Next player'} (${nextRole}) continues the search.`
                });
              } else {
                stage.seeking = null;
              }
            } else {
              if (stage.seeking === leavingRole) {
                const idx = oldChain.indexOf(leavingRole);
                stage.seeking = (idx !== -1 && idx < oldChain.length - 1) ? oldChain[idx + 1] : null;
              }
            }

            chat.push({ sys: true, text: `${leavingRole} left the court. The chain has been updated.` });
            chat.push({ sys: true, text: `Current Chain: ${newChain.join(' ➔ ')}` });

            if (!stage.seeking || newChain.length <= 1) {
              data.phase = 'reveal';
              chat.push({ sys: true, text: `🏆 Round complete! All roles have been revealed.` });
            }
          }

          if (players.length < 2) {
            data.phase = 'waiting';
            chat.push({ sys: true, text: `Not enough players. Returning to waiting room.` });
          }

          await fbPatch('rooms/' + code, {
            players,
            host,
            chat,
            stage,
            roles,
            phase: data.phase
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = async () => {
    if (!roomData || roomData.host !== myId) return;
    const players = roomData.players || [];
    const n = players.length;
    const roles = activeRoles(n);
    
    const rlist = [...roles];
    for (let i = rlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rlist[i], rlist[j]] = [rlist[j], rlist[i]];
    }
    
    const chits = rlist.map((role, idx) => ({
      id: idx,
      role: role,
      pickedBy: null
    }));
    
    const chat = roomData.chat || [];
    chat.push({ sys: true, text: '━━ Shuffling court chits... ━━' });
    
    await fbSet('rooms/' + roomCode, {
      ...roomData,
      roles: {},
      chits,
      stage: { seekerId: null, seeking: null, foundIds: [], activeRoles: roles },
      phase: 'shuffling',
      chat
    });
    
    setTimeout(async () => {
      try {
        const currentData = await fbGet('rooms/' + roomCode);
        if (currentData && currentData.phase === 'shuffling') {
          currentData.phase = 'picking';
          currentData.chat.push({ sys: true, text: '━━ Chits scattered! Claim your role! ━━' });
          await fbSet('rooms/' + roomCode, currentData);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  const claimChit = async (cId) => {
    if (isPickLocked) return;
    setIsPickLocked(true);
    setTimeout(() => { setIsPickLocked(false); }, 1000);

    try {
      const data = await fbGet('rooms/' + roomCode);
      if (!data || data.phase !== 'picking') return;
      
      const chits = data.chits || [];
      const roles = data.roles || {};
      
      if (chits[cId].pickedBy) {
        showNotification('Someone else claimed this chit! Try another one.');
        return;
      }
      
      chits[cId].pickedBy = myId;
      roles[myId] = chits[cId].role;
      
      const players = data.players || [];
      const allPicked = chits.every(c => !!c.pickedBy);
      
      let nextPhase = 'picking';
      let stage = data.stage || {};
      
      if (allPicked) {
        nextPhase = 'playing';
        const rajaId = Object.keys(roles).find(id => roles[id] === 'Raja');
        const activeR = activeRoles(players.length);
        stage = {
          seekerId: rajaId,
          seeking: activeR[1],
          foundIds: [],
          activeRoles: activeR
        };
        
        data.chat.push({ sys: true, text: '━━ All chits claimed! The game begins! ━━' });
        data.chat.push({ sys: true, text: 'Raja is searching for Rani...' });
      }
      
      await fbSet('rooms/' + roomCode, {
        ...data,
        roles,
        chits,
        phase: nextPhase,
        stage
      });
    } catch (e) {
      console.error(e);
    }
  };

  const pickPlayer = async (targetId) => {
    if (isPickLocked) return;
    setIsPickLocked(true);
    setTimeout(() => { setIsPickLocked(false); }, 1500);

    try {
      const data = await fbGet('rooms/' + roomCode);
      if (!data || data.phase !== 'playing') return;
      const stage = data.stage || {};
      if (stage.seekerId !== myId) return;

      const players    = data.players || [];
      const roleMap    = data.roles   || {};
      const chat       = data.chat    || [];
      const foundIds   = [...(stage.foundIds || [])];
      const roles      = stage.activeRoles || activeRoles(players.length);

      const me         = players.find(p => p.id === myId);
      const target     = players.find(p => p.id === targetId);
      const targetRole = roleMap[targetId];
      const myRoleNow  = roleMap[myId];
      const seeking    = stage.seeking;

      if (targetRole === seeking) {
        const seekerPoints = ROLE_DATA[myRoleNow].pts;
        const meP = players.find(p => p.id === myId);
        if (meP) {
          meP.score += seekerPoints;
          if (!meP.history) meP.history = [];
          const rIdx = (data.round || 1) - 1;
          meP.history[rIdx] = (meP.history[rIdx] || 0) + seekerPoints;
        }

        chat.push({ sys: true, text: `✓ ${me.name} (${myRoleNow}) correctly found ${target.name} (${seeking}) — +${seekerPoints} pts!` });
        foundIds.push(myId);

        if (isLastRole(roles, seeking)) {
          chat.push({ sys: true, text: `🏆 Round complete! All roles have been revealed.` });
          ensureHistory(players, data.round || 1);
          await fbSet('rooms/' + roomCode, { ...data, players, roles: roleMap, chat, stage: { ...stage, foundIds }, phase: 'reveal' });
        } else {
          const nextSeeking = roleSeeks(roles, seeking);
          chat.push({ sys: true, text: `${target.name} (${seeking}) now seeks the ${nextSeeking}...` });
          await fbSet('rooms/' + roomCode, {
            ...data,
            players,
            roles: roleMap,
            chat,
            stage: { ...stage, seekerId: targetId, seeking: nextSeeking, foundIds, activeRoles: roles }
          });
        }
      } else {
        chat.push({ sys: true, text: `✗ Wrong! ${me.name} guessed ${target.name}. Roles swapped!` });
        roleMap[myId]     = targetRole;
        roleMap[targetId] = myRoleNow;
        chat.push({ sys: true, text: `${target.name} (now ${myRoleNow}) continues searching for ${seeking}...` });
        await fbSet('rooms/' + roomCode, {
          ...data,
          players,
          roles: roleMap,
          chat,
          stage: { ...stage, seekerId: targetId, seeking, foundIds, activeRoles: roles }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendChat = async () => {
    const txt = chatInput.trim();
    if (!txt || !roomCode) return;
    setChatInput('');
    try {
      const data = await fbGet('rooms/' + roomCode);
      if (!data) return;
      const me = (data.players || []).find(p => p.id === myId);
      if (!me) return;
      const chat = data.chat || [];
      chat.push({ name: me.name, color: me.color, text: ': ' + txt });
      await fbPatch('rooms/' + roomCode, { chat });
    } catch (e) {}
  };

  const triggerNextRound = async () => {
    if (!roomData || roomData.host !== myId) return;
    const players = roomData.players || [];
    const n = players.length;
    const roles = activeRoles(n);
    
    const rlist = [...roles];
    for (let i = rlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rlist[i], rlist[j]] = [rlist[j], rlist[i]];
    }
    
    const chits = rlist.map((role, idx) => ({
      id: idx,
      role: role,
      pickedBy: null
    }));
    
    const nextRoundNum = (roomData.round || 1) + 1;
    const chat = roomData.chat || [];
    chat.push({ sys: true, text: `━━ Round ${nextRoundNum} begins! Shuffling court chits... ━━` });
    
    await fbSet('rooms/' + roomCode, {
      ...roomData,
      roles: {},
      chits,
      stage: { seekerId: null, seeking: null, foundIds: [], activeRoles: roles },
      phase: 'shuffling',
      round: nextRoundNum,
      chat
    });
    
    setTimeout(async () => {
      try {
        const currentData = await fbGet('rooms/' + roomCode);
        if (currentData && currentData.phase === 'shuffling' && currentData.round === nextRoundNum) {
          currentData.phase = 'picking';
          currentData.chat.push({ sys: true, text: `━━ Round ${nextRoundNum} chits scattered! Claim your role! ━━` });
          await fbSet('rooms/' + roomCode, currentData);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  // Determine which screen is active
  let activeScreen = 'lobby';
  if (roomData) {
    if (roomData.phase === 'waiting') {
      activeScreen = 'waiting';
    } else if (roomData.phase === 'shuffling' || roomData.phase === 'picking') {
      const myRole = roomData.roles?.[myId];
      if (myRole) {
        activeScreen = 'game';
      } else {
        activeScreen = 'waiting'; // picking interface
      }
    } else if (roomData.phase === 'playing') {
      activeScreen = 'game';
    } else if (roomData.phase === 'reveal') {
      activeScreen = 'reveal';
    }
  }

  // Pre-calculations for Game screen
  const myRole = roomData?.roles?.[myId];
  const myRoleData = myRole ? ROLE_DATA[myRole] : null;
  const isHost = roomData?.host === myId;
  const gameStage = roomData?.stage || {};
  const activeRoundRoles = gameStage.activeRoles || (roomData ? activeRoles(roomData.players.length) : []);
  const seeksRole = myRole ? roleSeeks(activeRoundRoles, myRole) : null;
  const isLast = myRole ? isLastRole(activeRoundRoles, myRole) : false;
  const isMySeekerTurn = gameStage.seekerId === myId;
  const currentRound = roomData?.round || 1;

  return (
    <>
      {/* Background doodles */}
      <BackgroundDoodles />

      {/* Notifications toast */}
      {notification && (
        <div className="notif show" id="notif">
          {notification}
        </div>
      )}

      {/* 1. LOBBY SCREEN */}
      {activeScreen === 'lobby' && (
        <div className="screen active" id="lobby">
          <span className="crown">♚</span>
          <div className="title">Raja Rani</div>
          <div className="subtitle">The Royal Court · Online Multiplayer</div>
          
          {!import.meta.env.VITE_FIREBASE_URL && (
            <div id="setup-warn" className="setup-warning">
              <p>
                ⚠️ Firebase URL not configured!<br />
                Create a <code>.env</code> file in the project root containing:<br />
                <code>VITE_FIREBASE_URL=your_firebase_database_url</code>
              </p>
            </div>
          )}

          <div className="card">
            <h3>Enter the Court</h3>
            <input
              className="gi"
              id="inp-name"
              placeholder="Your name..."
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createRoom(); }}
            />
          </div>

          <div className="card">
            <h3>Create a Room</h3>
            <button className="btn" onClick={createRoom} style={{ width: '100%' }}>
              Create New Room
            </button>
          </div>

          <div className="card">
            <h3>Join a Room</h3>
            <div className="row">
              <input
                className="gi"
                id="inp-code"
                placeholder="Room code e.g. AB12CD"
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') joinRoom(); }}
              />
              <button className="btn btn-o" onClick={joinRoom}>
                Join
              </button>
            </div>
            {lobbyError && <div className="err" id="lerr">{lobbyError}</div>}
          </div>
        </div>
      )}

      {/* 2. WAITING SCREEN (including Picking) */}
      {activeScreen === 'waiting' && roomData && (
        <div className="screen active" id="waiting">
          {roomData.phase === 'waiting' && (
            <button className="btn btn-o btn-red waiting-leave" id="w-leave-btn" onClick={leaveRoom}>
              Leave
            </button>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '2rem',
            width: '100%',
            position: 'relative'
          }}>
            <div className="waiting-top-wrapper">
              {/* Lobby Header */}
              {roomData.phase === 'waiting' && (
                <div id="lobby-header" style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <div style={{
                    fontSize: '.7rem',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: 'var(--text-light)',
                    marginBottom: '.3rem'
                  }}>
                    Room Code
                  </div>
                  <div className="rc-big" id="wcode">{roomCode}</div>
                  <div className="copying" id="copy-btn" onClick={copyCode}>
                    📋 Tap to copy &amp; share with friends
                  </div>
                </div>
              )}

              {/* Picking Header */}
              {(roomData.phase === 'shuffling' || roomData.phase === 'picking') && (
                <div id="picking-header" style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <h2 className="title" id="waiting-picking-title" style={{ marginBottom: '0.2rem' }}>
                    {localShuffling ? 'Shuffling Court...' : 'Claim Your Chit'}
                  </h2>
                  <div className="subtitle" id="waiting-picking-subtitle" style={{ marginBottom: 0 }}>
                    {localShuffling ? '🔮 JUGGLING AND SHUFFLING COURT CHITS...' : 'TAP A FOLDED PAPER TO CLAIM YOUR ROLE'}
                  </div>
                </div>
              )}
            </div>

            {/* Bowl Container (for shuffling or standard waiting phase) */}
            {(roomData.phase === 'waiting' || localShuffling) && (
              <div className="bowl-container" id="waiting-bowl-container">
                <div className={`bowl-back ${localShuffling ? 'shuffling' : ''}`} id="bowl-back" />
                <div className="chits-layer" id="chits-layer">
                  {roomData.phase === 'waiting' && Array.from({ length: roomData.players?.length || 0 }).map((_, idx) => {
                    const pos = BOWL_CHIT_POSITIONS[idx % BOWL_CHIT_POSITIONS.length] || { x: 65, y: 70, rot: 0 };
                    return (
                      <div
                        key={idx}
                        className="bowl-chit"
                        style={{
                          animation: 'none',
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          transform: `rotate(${pos.rot}deg)`
                        }}
                      />
                    );
                  })}
                </div>
                <div className={`bowl-front ${localShuffling ? 'shuffling' : ''}`} id="bowl-front">
                  <div className="bowl-glass-reflection" />
                </div>
              </div>
            )}

            <div className="waiting-bottom-wrapper">
              {/* Lobby Footer */}
              {roomData.phase === 'waiting' && (
                <div id="lobby-footer" style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100%',
                  maxWidth: '360px'
                }}>
                  <div style={{
                    fontSize: '.7rem',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: 'var(--text-light)',
                    marginBottom: '.6rem'
                  }}>
                    Players <span id="wcount">{roomData.players?.length || 0}</span>/8 &nbsp;·&nbsp;{' '}
                    <span id="wroles" style={{ color: 'var(--primary)', textTransform: 'none', letterSpacing: 'normal' }}>
                      Roles: {activeRoles(roomData.players?.length || 0).join(', ')}
                    </span>
                  </div>
                  
                  <div className="slots" id="wslots">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const p = roomData.players?.[idx];
                      if (p) {
                        return (
                          <div key={idx} className="slot on">
                            <div className="dot" style={{ backgroundColor: p.color }} />
                            <span style={{ fontSize: '.82rem' }}>
                              {p.name}{p.id === roomData.host ? ' ♚' : ''}
                            </span>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="slot">
                            <div className="dot" />
                            <span style={{ color: 'var(--text-light)', fontSize: '.78rem' }}>Empty</span>
                          </div>
                        );
                      }
                    })}
                  </div>

                  <div className="smsg" id="wstatus">
                    {isHost
                      ? (roomData.players?.length >= 2 ? `${roomData.players.length}/8 players ready. You can start!` : 'Need at least 2 players.')
                      : `Waiting for host to start... (${roomData.players?.length || 0}/8)`}
                  </div>

                  <div style={{ marginTop: '1.2rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      className="btn"
                      id="sbtn"
                      onClick={startGame}
                      disabled={!isHost || roomData.players?.length < 2}
                    >
                      Start Game
                    </button>
                    <button className="btn btn-o" onClick={() => setIsHowToPlayOpen(true)}>
                      How To Play
                    </button>
                  </div>
                </div>
              )}

              {/* Picking Area (Scattered Chits) */}
              {roomData.phase === 'picking' && !localShuffling && (
                <div id="picking-area-container" style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%'
                }}>
                  <div className="scattered-chits-container" style={{ marginTop: 0 }}>
                    <div className="scattered-chits" id="waiting-scattered-chits">
                      {(roomData.chits || []).map((c, idx) => {
                        const pos = SCATTERED_CHIT_POSITIONS[idx % SCATTERED_CHIT_POSITIONS.length];
                        if (c.pickedBy) return null; // Hide claimed chits
                        
                        return (
                          <div
                            key={c.id}
                            className="sc-chit"
                            style={{
                              left: pos.x,
                              top: pos.y,
                              transform: `rotate(${pos.rot}deg)`
                            }}
                            onClick={() => claimChit(c.id)}
                          >
                            <div className="sc-chit-scribble">?</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="smsg" id="waiting-picking-status" style={{ marginTop: '1rem' }}>
                    Chits claimed: {Object.keys(roomData.roles || {}).length}/{roomData.players?.length || 0} ·{' '}
                    Waiting for remaining players...
                  </div>
                </div>
              )}

              {localShuffling && (
                <div id="picking-area-container" style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%'
                }}>
                  <div className="scattered-chits-container">
                    <div className="scattered-chits">
                      {(roomData.chits || []).map((c, idx) => {
                        const pos = SCATTERED_CHIT_POSITIONS[idx % SCATTERED_CHIT_POSITIONS.length];
                        const bowlPos = BOWL_CHIT_POSITIONS[idx % BOWL_CHIT_POSITIONS.length] || { x: 65, y: 70, rot: 0 };
                        const offsetX = bowlPos.x - 80;
                        const offsetY = bowlPos.y;
                        
                        return (
                          <div
                            key={c.id}
                            className="sc-chit sc-chit-pour"
                            style={{
                              '--target-x': pos.x,
                              '--target-y': pos.y,
                              '--rot': `${pos.rot}deg`,
                              '--offset-x': `${offsetX}px`,
                              '--offset-y': `${offsetY}px`,
                              '--init-rot': `${bowlPos.rot}deg`
                            }}
                          >
                            <div className="sc-chit-scribble">?</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="smsg" style={{ marginTop: '1rem' }}>Scattering chits...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. GAME SCREEN */}
      {activeScreen === 'game' && roomData && myRoleData && (
        <div className="screen active" id="game">
          <div className="gl">
            {/* Secret Chit */}
            <div className="chit-container">
              <div
                className={`chit ${isChitUnfolded ? 'unfolded' : 'folded'}`}
                id="role-chit"
                onClick={() => { if (!isChitUnfolded) setIsChitUnfolded(true); }}
              >
                {/* Folded State */}
                <div className="chit-folded-content">
                  <div className="crease-v" />
                  <div className="crease-h" />
                  <div className="chit-scribble">?</div>
                  <div className="chit-tap-hint">tap to open...</div>
                </div>
                {/* Unfolded State */}
                <div className="chit-unfolded-content">
                  <div className="chit-close-btn" onClick={(e) => { e.stopPropagation(); setIsChitUnfolded(false); }}>
                    Fold ↩
                  </div>
                  <div className="chit-body">
                    <div className="chit-left">
                      <div className="role-svg-container" id="my-role-svg">
                        <RoleSvg role={myRole} />
                      </div>
                      <div className="chit-pts-value" id="chit-pts">
                        {myRoleData.pts} PTS
                      </div>
                    </div>
                    <div className="chit-right">
                      <div className="chit-label">Your Secret Role</div>
                      <div className="rname" id="g-role">{myRole}</div>
                      <div className="rdesc" id="g-desc">
                        {isLast ? `You are the ${myRole} — stay hidden!` : (seeksRole ? `Find the ${seeksRole} to earn ${myRoleData.pts} pts!` : '...')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Turn Banner */}
            <div className="sbanner">
              <div className="slabel" id="sl">
                {roomData.phase === 'picking'
                  ? 'WAITING FOR COURT'
                  : (isMySeekerTurn
                      ? `YOUR TURN — FIND THE ${(gameStage.seeking || '').toUpperCase()}`
                      : `${(roomData.players?.find(p => p.id === gameStage.seekerId)?.name || '?').toUpperCase()} IS SEEKING`
                    )
                }
              </div>
              <div className="saction" id="sa">
                {roomData.phase === 'picking'
                  ? 'Waiting for other players to claim their chits...'
                  : (isMySeekerTurn
                      ? `Tap the player you think is the ${gameStage.seeking}!`
                      : `${roomData.players?.find(p => p.id === gameStage.seekerId)?.name || '?'} is looking for the ${gameStage.seeking}...`
                    )
                }
              </div>
            </div>

            {/* Players Grid */}
            <div className="pa">
              <h4>Players</h4>
              <div className="pgrid" id="pgrid">
                {(roomData.players || []).map((p) => {
                  const isMe = p.id === myId;
                  const isSeeker = p.id === gameStage.seekerId;
                  const isFound = (gameStage.foundIds || []).includes(p.id);
                  const canPick = isMySeekerTurn && !isMe && !isSeeker && !isFound;

                  let cls = 'pc';
                  if (isMe) cls += ' pself';
                  else if (isFound) cls += ' pfound';
                  else if (canPick) cls += ' pok';
                  else cls += ' pdis';

                  let customStyle = {
                    backgroundColor: p.color,
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.03)'
                  };
                  if (isMe) {
                    customStyle = {
                      backgroundColor: '#ffffff',
                      borderColor: 'var(--border-color)',
                      borderStyle: 'dashed'
                    };
                  } else if (isFound) {
                    customStyle = {
                      backgroundColor: '#d6e2d1',
                      borderColor: '#a4be96'
                    };
                  }

                  return (
                    <div
                      key={p.id}
                      className={cls}
                      style={customStyle}
                      onClick={() => { if (canPick) pickPlayer(p.id); }}
                    >
                      <div className="pav" style={{ background: 'rgba(255,255,255,0.4)', border: '2px solid rgba(0,0,0,0.06)' }}>
                        {p.avatar}
                      </div>
                      <div className="pname">{p.name}</div>
                      <div className="ppts">{p.score} pts</div>
                      {isMe && <div className="pbadge byou">You</div>}
                      {isSeeker && !isMe && <div className="pbadge bturn">Seeking</div>}
                      {isFound && !isSeeker && <div className="pbadge bfound">✓ Found</div>}
                      {canPick && <button className="cbtn">Choose ✓</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="gr">
            <div className="chat-panel">
              <div className="ch">
                <span>Royal Messenger ✦</span>
                <button className="leave-btn" onClick={leaveRoom}>Leave Game</button>
              </div>
              <div className="cm" id="cm" ref={chatEndRef}>
                {(roomData.chat || []).map((msg, idx) => {
                  if (msg.sys) {
                    return (
                      <div key={idx} className="msg sys">
                        {msg.text}
                      </div>
                    );
                  } else {
                    return (
                      <div key={idx} className="msg">
                        <span className="mn" style={{ color: msg.color }}>
                          {msg.name}
                        </span>
                        {msg.text}
                      </div>
                    );
                  }
                })}
              </div>
              <div className="cir">
                <input
                  className="ci"
                  id="ci"
                  placeholder="Message..."
                  maxLength={100}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                />
                <button className="cs" onClick={sendChat}>↑</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REVEAL SCREEN */}
      {activeScreen === 'reveal' && roomData && (
        <div className="screen active" id="reveal">
          <div className="rtitle">Round Over!</div>
          <div className="rsub" id="rresult">
            {(() => {
              const roleMap = roomData.roles || {};
              const players = roomData.players || [];
              const stage = roomData.stage || {};
              const roles = stage.activeRoles || activeRoles(players.length);
              
              const lastRole   = roles[roles.length - 1];
              const lastRoleId = Object.keys(roleMap).find(id => roleMap[id] === lastRole);
              const lastP      = players.find(p => p.id === lastRoleId);
              
              const prevRole   = roles[roles.length - 2];
              const prevId     = Object.keys(roleMap).find(id => roleMap[id] === prevRole);
              const prevP      = players.find(p => p.id === prevId);
              
              return `${prevP ? prevP.name : prevRole} found ${lastP ? lastP.name : 'them'} (the ${lastRole})!`;
            })()}
          </div>

          <div className="rcards" id="rcards">
            {(() => {
              const roleMap = roomData.roles || {};
              const players = roomData.players || [];
              const stage = roomData.stage || {};
              const roles = stage.activeRoles || activeRoles(players.length);
              
              return roles.map((role) => {
                const pid = Object.keys(roleMap).find(id => roleMap[id] === role);
                const player = players.find(p => p.id === pid);
                
                return (
                  <div key={role} className="rcard2">
                    <div style={{ width: '50px', height: '50px', margin: '0 auto 5px' }}>
                      <RoleSvg role={role} />
                    </div>
                    <div className="rr">{role}</div>
                    <div className="rn">{player ? player.name : '?'}</div>
                    <div className="rp">{player ? player.score : 0}</div>
                    <div className="rpl">total pts</div>
                  </div>
                );
              });
            })()}
          </div>

          <div style={{
            fontSize: '.75rem',
            color: 'var(--text-light)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '.65rem',
            fontWeight: 600
          }}>
            Leaderboard
          </div>

          {/* Leaderboard Board */}
          <div className="sb" id="lboard">
            {(() => {
              const players = roomData.players || [];
              ensureHistory(players, roomData.round || 1);
              const sorted = [...players].sort((a, b) => b.score - a.score);
              
              return (
                <div className="sb-table-wrapper">
                  <table className="sb-table">
                    <thead>
                      <tr>
                        <th>Round</th>
                        {sorted.map(p => (
                          <th key={p.id}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{p.avatar}</span>
                              <span style={{ fontWeight: 700 }}>{p.name}{p.id === myId ? ' (you)' : ''}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: currentRound }).map((_, rIdx) => {
                        const r = rIdx + 1;
                        return (
                          <tr key={r}>
                            <td>Round {r}</td>
                            {sorted.map(p => {
                              const rScore = p.history?.[r - 1] !== undefined ? p.history[r - 1] : 0;
                              return <td key={p.id}>{rScore}</td>;
                            })}
                          </tr>
                        );
                      })}
                      <tr className="sb-table-total">
                        <td>Total</td>
                        {sorted.map(p => (
                          <td key={p.id} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {p.score} pts
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={triggerNextRound} disabled={!isHost}>
              Next Round
            </button>
            <button className="btn btn-o btn-red" onClick={leaveRoom}>
              Leave
            </button>
          </div>
          <div className="smsg" id="rwaitmsg" style={{ marginTop: '.75rem' }}>
            {!isHost && 'Waiting for host to start next round...'}
          </div>
        </div>
      )}

      {/* 5. HOW TO PLAY OVERLAY MODAL */}
      {isHowToPlayOpen && (
        <div id="howToPlayModal" style={{
          display: 'flex',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.8)',
          zIndex: 1000,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#120820',
            border: '1px solid rgba(240,192,96,.3)',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            padding: '20px',
            color: '#e8d5b7',
            textAlign: 'left'
          }}>
            <h2 style={{ color: '#f0c060', marginBottom: '15px' }}>
              How To Play
            </h2>
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Unlike the usual game, the rules are a bit different. The game starts as the raja finds the rani and progresses
              as each person finds the next role and the game ends when the police finds the thief.
            </p>
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              If you correctly identify the next person, you will earn the points of your role:
              Raja (1000), Rani (800), Mantri (600), Milkman (500), Police (400), Postman (300), Guard (250), Thief (0).
              The one you found starts seeking the next person.
            </p>
            <p style={{ marginBottom: '15px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              If you fail to correctly identify the next role, you will swap your role with the person you chose and they will
              continue playing with your role.
            </p>
            <button className="btn" onClick={() => setIsHowToPlayOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
