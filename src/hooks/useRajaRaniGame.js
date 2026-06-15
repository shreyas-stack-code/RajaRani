import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { fbGet, fbSet, fbPatch, fbDelete } from '../firebase';

export const ALL_ROLES = ['Raja', 'Rani', 'Mantri', 'Milkman', 'Postman', 'Guard', 'Police', 'Thief'];
export const ROLE_DATA = {
  Raja:     { emoji: '♚', pts: 1000, desc: 'Find the Rani to earn 1000 pts!' },
  Rani:     { emoji: '♛', pts: 800, desc: 'Find the Mantri to earn 800 pts!' },
  Mantri:   { emoji: '⚜', pts: 600, desc: 'Find the Milkman to earn 600 pts!' },
  Milkman:  { emoji: '🥛', pts: 500, desc: 'Find the Postman to earn 500 pts!' },
  Postman:  { emoji: '✉', pts: 300, desc: 'Find the Guard to earn 300 pts!' },
  Guard:    { emoji: '🛡️', pts: 250, desc: 'Find the Police to earn 250 pts!' },
  Police:   { emoji: '⚔️', pts: 400, desc: 'Find the Thief to earn 400 pts!' },
  Thief:    { emoji: '🗡️', pts: 0, desc: 'You are the Thief — stay hidden!' }
};

export const AVTR = ['🎭','🃏','🎲','🎯','🎪','🎨','🔮','🔱'];
export const CLRS = ['#ebd2c8', '#ccd9e8', '#c5d3c1', '#d7cedf', '#ebdcb9', '#e8d1e5', '#c2e2e4', '#e5e8d1'];

export function activeRoles(n) {
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

export function roleSeeks(roles, role) {
  const i = roles.indexOf(role);
  if (i === -1 || i === roles.length - 1) return null;
  return roles[i + 1];
}

export function isLastRole(roles, role) {
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

export default function useRajaRaniGame() {
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

  // Refs for tracking changes
  const lastShuffledRoundRef = useRef(0);
  const prevPhaseRef = useRef('');
  const prevRoomDataRef = useRef(null);

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
  const phase = roomData?.phase;
  const round = roomData?.round;

  useEffect(() => {
    if (phase === 'shuffling') {
      const r = round || 1;
      if (lastShuffledRoundRef.current !== r) {
        setLocalShuffling(true);
        lastShuffledRoundRef.current = r;
        const timer = setTimeout(() => {
          setLocalShuffling(false);
        }, 2800);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, round]);

  // Confetti triggers
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
      setLobbyError('Firebase URL is not configured. Please add VITE_FIREBASE_URL in your env.');
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
      setLobbyError('Firebase URL is not configured. Please add VITE_FIREBASE_URL in your env.');
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
      if (!data || (data.phase !== 'picking' && data.phase !== 'shuffling')) return;
      
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

  return {
    myId,
    name, setName,
    myName, setMyName,
    roomCode, setRoomCode,
    roomData, setRoomData,
    joinCode, setJoinCode,
    lobbyError, setLobbyError,
    notification, showNotification,
    isChitUnfolded, setIsChitUnfolded,
    isHowToPlayOpen, setIsHowToPlayOpen,
    chatInput, setChatInput,
    isPickLocked, setIsPickLocked,
    localShuffling,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    claimChit,
    pickPlayer,
    sendChat,
    triggerNextRound,
    copyCode
  };
}
