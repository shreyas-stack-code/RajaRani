  const FIREBASE_URL = "https://raja-rani-gamez-default-rtdb.asia-southeast1.firebasedatabase.app/";


  // ─────────────────────────────────────────────
//  ROLE DEFINITIONS
//  Roles are assigned in order based on player count.
//  The chain is always: roles[0] seeks roles[1], roles[1] seeks roles[2], etc.
//  The LAST role in the active set is the "end" — game ends when they're found.
// ─────────────────────────────────────────────
const ALL_ROLES = ['Raja','Rani','Mantri','Police','Thief'/*,'Milkman','Postman','Guard'*/];
//const ROLE_ORDER = ['Raja','Rani','Mantri','Milkman','Postman','Guard','Police','Thief'];
const ROLE_DATA = {
  Raja:   { emoji:'♚', pts:1000 },
  Rani:   { emoji:'♛', pts:800  },
  Mantri: { emoji:'⚜', pts:600  },
  Police: { emoji:'⚔', pts:400  },
  Thief:  { emoji:'🗡', pts:200  }
};
// Points go to the SEEKER on a correct guess
// For n players, active roles = ALL_ROLES.slice(0, n)
// Seek chain: Raja→Rani, Rani→Mantri, ..., secondLast→Last
// Game ends when the last role is found

const AVTR = ['🎭','🃏','🎲','🎯','🎪'];
const CLRS = ['#ebd2c8', '#ccd9e8', '#c5d3c1', '#d7cedf', '#ebdcb9'];

function activeRoles(n) {
  const roleSets = {
    2: ['Raja', 'Thief'],
    3: ['Raja', 'Police', 'Thief'],
    4: ['Raja', 'Rani', 'Police', 'Thief'],
    5: ['Raja', 'Rani', 'Mantri', 'Police', 'Thief'],
    6: ['Raja', 'Rani', 'Mantri', 'Spy', 'Police', 'Thief'],
    7: ['Raja', 'Rani', 'Mantri', 'Spy', 'Assassin', 'Police', 'Thief'],
    8: ['Raja', 'Rani', 'Mantri', 'Spy', 'Assassin', 'Guard', 'Police', 'Thief']
  };

  return roleSets[n] || roleSets[8];
}

  function roleSeeks(roles, role) {
  const i = roles.indexOf(role);
  if (i === -1 || i === roles.length - 1) return null; // last role seeks nobody
  return roles[i + 1];
}
function isLastRole(roles, role) { return roles[roles.length - 1] === role; }

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let myId         = 'p' + Math.random().toString(36).slice(2,9);
let myName       = '';
let myRoom       = '';
let pollTimer    = null;
let lastChatLen  = 0;
let lastPhase    = '';
let lastRound    = 0;
let isPickLocked = false;
let isChitUnfolded = false;

// ─────────────────────────────────────────────
//  PENCIL-SKETCH ROLE ILLUSTRATION SVGS
// ─────────────────────────────────────────────
function getRoleSvg(role) {
  const svgs = {
    Raja: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffeaa7" />
          <stop offset="100%" stop-color="#fdcb6e" />
        </linearGradient>
      </defs>
      <path d="M 22 75 L 26 40 L 40 55 L 50 35 L 60 55 L 74 40 L 78 75 Z" fill="url(#goldGrad)" opacity="0.85" />
      <path d="M 20 75 Q 50 72 80 75" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 22 75 L 26 40 L 40 55 L 50 35 L 60 55 L 74 40 L 78 75 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 23 74 L 27 42 L 39 53 M 50 38 L 59 53 L 73 42 L 77 74" stroke="#2c3e50" stroke-width="1" fill="none" opacity="0.6" />
      <circle cx="50" cy="31" r="3.5" fill="#ff7675" stroke="#2c3e50" stroke-width="1.5" />
      <circle cx="26" cy="36" r="3" fill="#0984e3" stroke="#2c3e50" stroke-width="1.5" />
      <circle cx="74" cy="36" r="3" fill="#0984e3" stroke="#2c3e50" stroke-width="1.5" />
    </svg>`,
    Rani: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fab1a0" />
          <stop offset="100%" stop-color="#ff7675" />
        </linearGradient>
      </defs>
      <path d="M 25 72 Q 50 40 75 72 Q 50 55 25 72 Z" fill="url(#pinkGrad)" opacity="0.85" />
      <path d="M 20 72 Q 50 70 80 72" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 25 72 Q 50 40 75 72" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 25 72 Q 50 55 75 72" stroke="#2c3e50" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M 26 71 Q 50 43 74 71" stroke="#2c3e50" stroke-width="1" fill="none" opacity="0.5" />
      <path d="M 50 38 C 48 34 44 34 44 38 C 44 42 50 46 50 46 C 50 46 56 42 56 38 C 56 34 52 34 50 38 Z" fill="#e84393" stroke="#2c3e50" stroke-width="1.5" />
      <circle cx="35" cy="55" r="2.5" fill="#74b9ff" stroke="#2c3e50" stroke-width="1.5" />
      <circle cx="65" cy="55" r="2.5" fill="#74b9ff" stroke="#2c3e50" stroke-width="1.5" />
    </svg>`,
    Mantri: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="peachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffeaa7" />
          <stop offset="100%" stop-color="#ffb8b8" />
        </linearGradient>
      </defs>
      <path d="M 30 25 C 45 25 45 35 60 35 L 55 75 C 40 75 40 65 25 65 Z" fill="url(#peachGrad)" opacity="0.85" />
      <path d="M 30 25 C 45 25 45 35 60 35 L 55 75 C 40 75 40 65 25 65 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
      <path d="M 30 25 C 25 25 25 35 30 35 C 35 35 35 25 30 25 Z" stroke="#2c3e50" stroke-width="2" fill="none" />
      <path d="M 55 75 C 50 75 50 65 55 65 C 60 65 60 75 55 75 Z" stroke="#2c3e50" stroke-width="2" fill="none" />
      <path d="M 34 42 L 48 42 M 32 48 L 46 48 M 30 54 L 42 54" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
      <path d="M 40 48 L 46 45 M 41 50 Q 38 58 43 58 Q 45 54 44 49" stroke="#ff7675" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </svg>`,
    Police: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#74b9ff" />
          <stop offset="100%" stop-color="#0984e3" />
        </linearGradient>
      </defs>
      <path d="M 50 20 L 75 30 L 70 65 L 50 85 L 30 65 L 25 30 Z" fill="url(#blueGrad)" opacity="0.85" />
      <path d="M 50 20 L 75 30 L 70 65 L 50 85 L 30 65 L 25 30 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
      <path d="M 50 22 L 73 31 L 68 63 L 50 82 L 32 63 L 27 31 Z" stroke="#2c3e50" stroke-width="1" fill="none" opacity="0.5" />
      <path d="M 50 35 L 54 45 L 65 45 L 56 51 L 60 62 L 50 55 L 40 62 L 44 51 L 35 45 L 46 45 Z" fill="#ffeaa7" stroke="#2c3e50" stroke-width="1.8" stroke-linejoin="round" />
    </svg>`,
    Thief: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="greyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b2bec3" />
          <stop offset="100%" stop-color="#636e72" />
        </linearGradient>
      </defs>
      <path d="M 40 38 C 30 38 25 55 25 70 C 25 82 35 85 50 85 C 65 85 75 82 75 70 C 75 55 70 38 60 38 C 55 46 45 46 40 38 Z" fill="url(#greyGrad)" opacity="0.85" />
      <path d="M 40 38 C 30 38 25 55 25 70 C 25 82 35 85 50 85 C 65 85 75 82 75 70 C 75 55 70 38 60 38 C 55 46 45 46 40 38 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
      <path d="M 38 38 Q 50 42 62 38" stroke="#ff7675" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 37 36 Q 50 40 63 36" stroke="#2c3e50" stroke-width="1" fill="none" />
      <path d="M 44 52 L 56 52 M 44 57 L 56 57 M 47 52 L 47 68 C 47 68 53 68 54 63" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </svg>`,
    Spy: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#81ecec" />
          <stop offset="100%" stop-color="#00cec9" />
        </linearGradient>
      </defs>
      <circle cx="45" cy="45" r="22" fill="url(#spyGrad)" opacity="0.8" />
      <circle cx="45" cy="45" r="22" stroke="#2c3e50" stroke-width="2.5" fill="none" />
      <circle cx="45" cy="45" r="18" stroke="#2c3e50" stroke-width="1" fill="none" opacity="0.5" />
      <path d="M 60 60 L 80 80" stroke="#2c3e50" stroke-width="5.5" stroke-linecap="round" fill="none" />
      <path d="M 60 60 L 80 80" stroke="#ff7675" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <text x="38" y="53" font-family="'Outfit', sans-serif" font-size="22" font-weight="700" fill="#2c3e50">?</text>
    </svg>`,
    Assassin: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="assGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a29bfe" />
          <stop offset="100%" stop-color="#6c5ce7" />
        </linearGradient>
      </defs>
      <path d="M 25 75 L 75 25" stroke="#2c3e50" stroke-width="3" stroke-linecap="round" />
      <path d="M 75 75 L 25 25" stroke="#2c3e50" stroke-width="3" stroke-linecap="round" />
      <circle cx="50" cy="50" r="10" fill="url(#assGrad)" opacity="0.9" stroke="#2c3e50" stroke-width="2" />
      <path d="M 32 62 L 40 70" stroke="#2c3e50" stroke-width="2.5" />
      <path d="M 68 62 L 60 70" stroke="#2c3e50" stroke-width="2.5" />
    </svg>`,
    Guard: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="guardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffeaa7" />
          <stop offset="100%" stop-color="#b2bec3" />
        </linearGradient>
      </defs>
      <path d="M 30 25 L 70 25 C 70 25 75 55 50 78 C 25 55 30 25 30 25 Z" fill="url(#guardGrad)" opacity="0.85" />
      <path d="M 30 25 L 70 25 C 70 25 75 55 50 78 C 25 55 30 25 30 25 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
      <path d="M 50 32 L 50 65 M 38 45 L 62 45" stroke="#ff7675" stroke-width="2.5" stroke-linecap="round" />
    </svg>`
  };
  return svgs[role] || '';
}

window.toggleChit = function(force) {
  const chit = document.getElementById('role-chit');
  if (!chit) return;
  if (force === false) {
    isChitUnfolded = false;
  } else {
    if (chit.classList.contains('folded')) {
      isChitUnfolded = true;
    } else {
      return;
    }
  }
  if (isChitUnfolded) {
    chit.classList.remove('folded');
    chit.classList.add('unfolded');
  } else {
    chit.classList.remove('unfolded');
    chit.classList.add('folded');
  }
};

// ─────────────────────────────────────────────
//  FIREBASE REST
// ─────────────────────────────────────────────
function dbUrl(path) { return FIREBASE_URL.replace(/\/$/, '') + '/' + path + '.json'; }
async function fbGet(path) {
  const r = await fetch(dbUrl(path));
  if (!r.ok) throw new Error('GET ' + r.status);
  return r.json();
}
async function fbSet(path, data) {
  data.ts = Date.now();
  const r = await fetch(dbUrl(path), { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  if (!r.ok) throw new Error('SET ' + r.status);
  return r.json();
}
async function fbPatch(path, data) {
  data.ts = Date.now();
  const r = await fetch(dbUrl(path), { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  if (!r.ok) throw new Error('PATCH ' + r.status);
  return r.json();
}
async function fbDelete(path) { await fetch(dbUrl(path), { method:'DELETE' }); }

// ─────────────────────────────────────────────
//  UI HELPERS
// ─────────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function notify(msg, dur=3000) {
  const n = document.getElementById('notif');
  n.textContent = msg; n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), dur);
}
function copyCode() {
  navigator.clipboard.writeText(myRoom).catch(()=>{});
  const b = document.getElementById('copy-btn');
  b.textContent = '✓ Copied!';
  setTimeout(() => { b.textContent = '📋 Tap to copy & share with friends'; }, 2000);
}
function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i=0;i<6;i++) s += c[Math.floor(Math.random()*c.length)];
  return s;
}

window.addEventListener('load', () => {
  if (!FIREBASE_URL || FIREBASE_URL === 'PASTE_YOUR_FIREBASE_URL_HERE')
    document.getElementById('setup-warn').style.display = 'block';
});

// ─────────────────────────────────────────────
//  LOBBY ACTIONS
// ─────────────────────────────────────────────
async function createRoom() {
  myName = document.getElementById('inp-name').value.trim();
  if (!myName) { document.getElementById('lerr').textContent = 'Enter your name first.'; return; }
  if (!FIREBASE_URL || FIREBASE_URL === 'PASTE_YOUR_FIREBASE_URL_HERE') {
    document.getElementById('lerr').textContent = 'Configure Firebase URL first!'; return;
  }
  myRoom = genCode();
  const data = {
    code:myRoom, host:myId, phase:'waiting',
    players:[{ id:myId, name:myName, color:CLRS[0], avatar:AVTR[0], score:0 }],
    roles:{}, stage:{ seekerId:null, seeking:null, foundIds:[] },
    chat:[{ sys:true, text:`Room created! Share code ${myRoom} with friends.` }],
    round:1
  };
  try { await fbSet('rooms/'+myRoom, data); enterWaiting(); }
  catch(e) { document.getElementById('lerr').textContent = 'Connection failed. Check Firebase URL.'; }
}

async function joinRoom() {
  myName = document.getElementById('inp-name').value.trim();
  const code = document.getElementById('inp-code').value.trim().toUpperCase();
  if (!myName) { document.getElementById('lerr').textContent = 'Enter your name.'; return; }
  if (!code)   { document.getElementById('lerr').textContent = 'Enter a room code.'; return; }
  if (!FIREBASE_URL || FIREBASE_URL === 'PASTE_YOUR_FIREBASE_URL_HERE') {
    document.getElementById('lerr').textContent = 'Configure Firebase URL first!'; return;
  }
  try {
    const data = await fbGet('rooms/'+code);
    if (!data)                   { document.getElementById('lerr').textContent = 'Room not found!'; return; }
    if (data.phase !== 'waiting'){ document.getElementById('lerr').textContent = 'Game already started.'; return; }
    const players = data.players || [];
    if (players.length >= 5)     { document.getElementById('lerr').textContent = 'Room is full (5/5).'; return; }
    const idx = players.length;
    players.push({ id:myId, name:myName, color:CLRS[idx], avatar:AVTR[idx], score:0 });
    const chat = data.chat || [];
    chat.push({ sys:true, text:`${myName} joined the court!` });
    await fbPatch('rooms/'+code, { players, chat });
    myRoom = code; enterWaiting();
  } catch(e) { document.getElementById('lerr').textContent = 'Connection failed.'; }
}

function enterWaiting() {
  document.getElementById('wcode').textContent = myRoom;
  show('waiting'); startPoll();
}

async function leaveRoom() {
  stopPoll();
  try {
    const data = await fbGet('rooms/'+myRoom);
    if (data) {
      const players = (data.players||[]).filter(p => p.id !== myId);
      if (players.length === 0) {
        await fbDelete('rooms/'+myRoom);
      } else {
        const host = data.host === myId ? players[0].id : data.host;
        const chat = data.chat || [];
        chat.push({ sys:true, text:`${myName} left the court.` });
        // If game was in progress and the leaver was the current seeker, pass turn to next player
        let stage = data.stage || {};
        if (data.phase === 'playing' && stage.seekerId === myId) {

    const oldChain = [...(stage.activeRoles || [])];

    const leavingIndex = oldChain.indexOf(leavingRole);

    const nextRole = oldChain[leavingIndex + 1];

    const nextSeekerId = Object.keys(roles)
        .find(id => roles[id] === nextRole);

    if (nextSeekerId) {

        stage.seekerId = nextSeekerId;

        const newChain = stage.activeRoles;

        const idx = newChain.indexOf(nextRole);

        stage.seeking =
            idx < newChain.length - 1
                ? newChain[idx + 1]
                : null;

        const nextPlayer = players.find(
            p => p.id === nextSeekerId
        );

        chat.push({
            sys:true,
            text:`${nextPlayer?.name || 'Next player'} continues the search.`
        });
    }
}
        // Remove their role
        // Get the role of the player leaving
const leavingRole = data.roles?.[myId];

// Remove their role assignment
const roles = { ...(data.roles || {}) };
delete roles[myId];

// Update the active role chain
if (data.phase === 'playing' && leavingRole) {

    const oldChain = [...(stage.activeRoles || [])];

    // Remove the role from the chain
    stage.activeRoles = oldChain.filter(r => r !== leavingRole);

    // If someone was supposed to find that role,
    // make them find the next role instead
    if (stage.seeking === leavingRole) {

        const idx = oldChain.indexOf(leavingRole);

        stage.seeking =
            idx < oldChain.length - 1
                ? oldChain[idx + 1]
                : null;
    }

    chat.push({
        sys: true,
        text: `${leavingRole} left the court. The chain has been updated.`
    });
}

await fbPatch('rooms/'+myRoom, {
    players,
    host,
    chat,
    stage,
    roles
});
      }
    }
  } catch(e) {}
  myRoom = '';
  lastChatLen = 0;
  lastPhase = '';

  document.getElementById('cm').innerHTML = '';

  show('lobby');
}

// ─────────────────────────────────────────────
//  POLLING
// ─────────────────────────────────────────────
function startPoll() { stopPoll(); pollTimer = setInterval(poll, 900); poll(); }
function stopPoll()  { if (pollTimer) { clearInterval(pollTimer); pollTimer=null; } }

async function poll() {
  try {
    const data = await fbGet('rooms/'+myRoom);
    if (!data) { stopPoll(); show('lobby'); return; }
    const me = (data.players||[]).find(p => p.id === myId);
    if (!me)   { stopPoll(); show('lobby'); return; }

    if      (data.phase==='waiting') { if(lastPhase!=='waiting'){show('waiting');lastPhase='waiting'} renderWaiting(data); }
    else if (data.phase==='playing') {
      if (lastPhase !== 'playing' || lastRound !== data.round) {
        show('game');
        lastPhase = 'playing';
        lastRound = data.round;
        lastChatLen = 0;
        document.getElementById('cm').innerHTML = '';
        isChitUnfolded = false;
        const chit = document.getElementById('role-chit');
        if (chit) {
          chit.className = 'chit folded';
        }
      }
      renderGame(data);
    }
    else if (data.phase==='reveal')  { if(lastPhase!=='reveal') {show('reveal');lastPhase='reveal'} renderReveal(data); }
  } catch(e) {}
}

// ─────────────────────────────────────────────
//  WAITING ROOM
// ─────────────────────────────────────────────
function renderWaiting(data) {
  const players = data.players || [];
  const n = players.length;
  document.getElementById('wcount').textContent = n;
  const roles = activeRoles(n);
  document.getElementById('wroles').textContent = 'Roles: ' + roles.join(', ');
  let h = '';
  for (let i=0;i<5;i++) {
    const p = players[i];
    if (p) h += `<div class="slot on"><div class="dot" style="background:${p.color}"></div><span style="font-size:.82rem">${p.name}${p.id===data.host?' ♚':''}</span></div>`;
    else   h += `<div class="slot"><div class="dot"></div><span style="color:#4a3025;font-size:.78rem">Empty</span></div>`;
  }
  document.getElementById('wslots').innerHTML = h;
  const isHost = data.host === myId;
  document.getElementById('sbtn').disabled = !(isHost && n >= 2);
  document.getElementById('wstatus').textContent =
    !isHost ? `Waiting for host to start... (${n}/5)` :
    n < 2   ? 'Need at least 2 players.' :
              `${n}/5 players ready. You can start!`;
}

function showHowToPlay() {
  document.getElementById('howToPlayModal').style.display = 'flex';
}

function closeHowToPlay() {
  document.getElementById('howToPlayModal').style.display = 'none';
}

async function startGame() {
  const data = await fbGet('rooms/'+myRoom);
  if (!data || data.host !== myId) return;
  const players = data.players || [];
  const n = players.length;
  const roles = activeRoles(n);
  // Shuffle roles
  const rlist = [...roles];
  for (let i=rlist.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[rlist[i],rlist[j]]=[rlist[j],rlist[i]]; }
  const roleMap = {};
  players.forEach((p,i) => { roleMap[p.id] = rlist[i]; });
  const rajaId = Object.keys(roleMap).find(id => roleMap[id]==='Raja');
  const chat = data.chat || [];
  chat.push({ sys:true, text:'━━ The game begins! ━━' });
  chat.push({ sys:true, text:`Raja is searching for Rani... (${n} players, roles: ${roles.join(' → ')})` });
  await fbSet('rooms/'+myRoom, {
    ...data, roles:roleMap,
    stage:{ seekerId:rajaId, seeking:roles[1], foundIds:[], activeRoles:roles },
    phase:'playing', chat
  });
}

// ─────────────────────────────────────────────
//  GAME RENDER
// ─────────────────────────────────────────────
function renderGame(data) {
  const roleMap = data.roles || {};
  const role = roleMap[myId];
  if (!role) return;
  const rd = ROLE_DATA[role];
  const stage = data.stage || {};
  const roles = stage.activeRoles || activeRoles((data.players||[]).length);
  const seeks = roleSeeks(roles, role);
  const isLast = isLastRole(roles, role);

  const svgContainer = document.getElementById('my-role-svg');
  if (svgContainer) {
    svgContainer.innerHTML = getRoleSvg(role);
  }
  const ptsEl = document.getElementById('chit-pts');
  if (ptsEl) {
    ptsEl.textContent = `${rd.pts} PTS`;
  }
  document.getElementById('g-role').textContent  = role;
  document.getElementById('g-desc').textContent  =
    isLast  ? `You are the ${role} — stay hidden!` :
    seeks   ? `Find the ${seeks} to earn ${rd.pts} pts!` : '...';

  const seekerId = stage.seekerId;
  const seeking  = stage.seeking;
  const foundIds = stage.foundIds || [];
  const players  = data.players || [];
  const seeker   = players.find(p => p.id === seekerId);
  const amI      = seekerId === myId;

  document.getElementById('sl').textContent = amI
    ? `YOUR TURN — FIND THE ${(seeking||'').toUpperCase()}`
    : `${seeker ? seeker.name.toUpperCase() : '?'} IS SEEKING`;
  document.getElementById('sa').textContent = amI
    ? `Tap the player you think is the ${seeking}!`
    : `${seeker ? seeker.name : '?'} is looking for the ${seeking}...`;

  let h = '';
  players.forEach(p => {
    const isMe    = p.id === myId;
    const isSk    = p.id === seekerId;
    const isFnd   = foundIds.includes(p.id);
    // Can pick: I am seeker, not myself, not the seeker, not already found
    const canPick = amI && !isMe && !isSk && !isFnd;

    let cls = 'pc';
    if (isMe)        cls += ' pself';
    else if (isFnd)  cls += ' pfound';
    else if (canPick)cls += ' pok';
    else             cls += ' pdis';

    let styleAttr = `background-color: ${p.color}; border-color: rgba(0, 0, 0, 0.12); box-shadow: 0 4px 8px rgba(0,0,0,0.03);`;
    if (isMe) {
      styleAttr = `background-color: #ffffff; border-color: var(--border-color); border-style: dashed;`;
    } else if (isFnd) {
      styleAttr = `background-color: #d6e2d1; border-color: #a4be96;`;
    }

    h += `<div class="${cls}" style="${styleAttr}" onclick="${canPick?`pick('${p.id}')`:''}" >
      <div class="pav" style="background:rgba(255,255,255,0.4);border:2px solid rgba(0,0,0,0.06)">${p.avatar}</div>
      <div class="pname">${p.name}</div>
      <div class="ppts">${p.score} pts</div>
      ${isMe              ? '<div class="pbadge byou">You</div>' : ''}
      ${isSk && !isMe     ? '<div class="pbadge bturn">Seeking</div>' : ''}
      ${isFnd && !isSk    ? '<div class="pbadge bfound">✓ Found</div>' : ''}
      ${canPick           ? '<button class="cbtn">Choose ✓</button>' : ''}
    </div>`;
  });
  document.getElementById('pgrid').innerHTML = h;

  // Chat sync
  const cm      = document.getElementById('cm');
  const chat    = data.chat || [];
  const newMsgs = chat.slice(lastChatLen);
  newMsgs.forEach(m => {
    const d = document.createElement('div');
    if (m.sys) { d.className='msg sys'; d.textContent=m.text; }
    else       { d.className='msg'; d.innerHTML=`<span class="mn" style="color:${m.color}">${m.name}</span>${m.text}`; }
    cm.appendChild(d);
  });
  if (newMsgs.length) cm.scrollTop = cm.scrollHeight;
  lastChatLen = chat.length;
}

// ─────────────────────────────────────────────
//  PICK LOGIC
// ─────────────────────────────────────────────
async function pick(targetId) {
  if (isPickLocked) return;
  isPickLocked = true;
  setTimeout(() => { isPickLocked = false; }, 1500);

  try {
    const data = await fbGet('rooms/'+myRoom);
    if (!data || data.phase !== 'playing') return;
    const stage = data.stage || {};
    if (stage.seekerId !== myId) return;

    const players    = data.players || [];
    const roleMap    = data.roles   || {};
    const chat       = data.chat    || [];
    const foundIds   = [...(stage.foundIds||[])];
    const roles      = stage.activeRoles || activeRoles(players.length);

    const me         = players.find(p => p.id === myId);
    const target     = players.find(p => p.id === targetId);
    const targetRole = roleMap[targetId];
    const myRoleNow  = roleMap[myId];
    const seeking    = stage.seeking;

    if (targetRole === seeking) {
      // ✓ CORRECT — seeker earns points for their current role
      const seekerPoints = ROLE_DATA[myRoleNow].pts;
      const meP = players.find(p => p.id === myId);
      if (meP) meP.score += seekerPoints;

      chat.push({ sys:true, text:`✓ ${me.name} (${myRoleNow}) correctly found ${target.name} (${seeking}) — +${seekerPoints} pts!` });

      // Mark target as found
      foundIds.push(myId);

      // Is this the last role? (target is the last in the chain)
      if (isLastRole(roles, seeking)) {
        // Game over
        chat.push({ sys:true, text:`🏆 Round complete! All roles have been revealed.` });
        await fbSet('rooms/'+myRoom, { ...data, players, roles:roleMap, chat, stage:{...stage, foundIds}, phase:'reveal' });
      } else {
        // Next seeker = the found player, seeking the next role
        const nextSeeking = roleSeeks(roles, seeking);
        chat.push({ sys:true, text:`${target.name} (${seeking}) now seeks the ${nextSeeking}...` });
        await fbSet('rooms/'+myRoom, { ...data, players, roles:roleMap, chat,
          stage:{ ...stage, seekerId:targetId, seeking:nextSeeking, foundIds, activeRoles:roles }
        });
      }
    } else {
      // ✗ WRONG — swap roles, same seeker becomes the new role, target continues the search
      chat.push({ sys:true, text:`✗ Wrong! ${me.name} guessed ${target.name}. Roles swapped!` });
      roleMap[myId]     = targetRole;
      roleMap[targetId] = myRoleNow;
      chat.push({ sys:true, text:`${target.name} (now ${myRoleNow}) continues searching for ${seeking}...` });
      await fbSet('rooms/'+myRoom, { ...data, players, roles:roleMap, chat,
        stage:{ ...stage, seekerId:targetId, seeking, foundIds, activeRoles:roles }
      });
    }
  } catch(e) { console.error(e); }
}

// ─────────────────────────────────────────────
//  CHAT
// ─────────────────────────────────────────────
async function sendChat() {
  const inp = document.getElementById('ci');
  const txt = inp.value.trim();
  if (!txt || !myRoom) return;
  inp.value = '';
  try {
    const data = await fbGet('rooms/'+myRoom);
    if (!data) return;
    const me = (data.players||[]).find(p => p.id === myId);
    if (!me) return;
    const chat = data.chat || [];
    chat.push({ name:me.name, color:me.color, text:': '+txt });
    await fbPatch('rooms/'+myRoom, { chat });
  } catch(e) {}
}

// ─────────────────────────────────────────────
//  REVEAL
// ─────────────────────────────────────────────
function renderReveal(data) {
  const roleMap = data.roles   || {};
  const players = data.players || [];
  const stage   = data.stage   || {};
  const roles   = stage.activeRoles || activeRoles(players.length);

  // Show result line
  const lastRole   = roles[roles.length - 1];
  const lastRoleId = Object.keys(roleMap).find(id => roleMap[id] === lastRole);
  const lastP      = players.find(p => p.id === lastRoleId);
  const prevRole   = roles[roles.length - 2];
  const prevId     = Object.keys(roleMap).find(id => roleMap[id] === prevRole);
  const prevP      = players.find(p => p.id === prevId);
  document.getElementById('rresult').textContent =
    `${prevP?prevP.name:prevRole} found ${lastP?lastP.name:'them'} (the ${lastRole})!`;

  // Role cards (mini paper chits)
  let ch = '';
  roles.forEach(role => {
    const pid    = Object.keys(roleMap).find(id => roleMap[id] === role);
    const player = players.find(p => p.id === pid);
    const rd     = ROLE_DATA[role];
    const roleSvg = getRoleSvg(role);
    ch += `<div class="rcard2">
      <div style="width: 50px; height: 50px; margin: 0 auto 5px;">${roleSvg}</div>
      <div class="rr">${role}</div>
      <div class="rn">${player?player.name:'?'}</div>
      <div class="rp">${player?player.score:0}</div>
      <div class="rpl">total pts</div>
    </div>`;
  });
  document.getElementById('rcards').innerHTML = ch;

  // Leaderboard
  const sorted = [...players].sort((a,b) => b.score - a.score);
  let lb = '';
  sorted.forEach((p,i) => {
    lb += `<div class="sbr"><div class="sbrank">${i+1}</div>
      <div class="sbname">${p.avatar} ${p.name}${p.id===myId?'<span class="tag">you</span>':''}</div>
      <div class="sbscore">${p.score} pts</div></div>`;
  });
  document.getElementById('lboard').innerHTML = lb;

  const isHost = data.host === myId;
  document.getElementById('nrbtn').disabled = !isHost;
  document.getElementById('rwaitmsg').textContent = isHost ? '' : 'Waiting for host to start next round...';
}

async function nextRound() {
  const data = await fbGet('rooms/'+myRoom);
  if (!data || data.host !== myId) return;
  const players = data.players || [];
  const n = players.length;
  const roles = activeRoles(n);
  const rlist = [...roles];
  for (let i=rlist.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[rlist[i],rlist[j]]=[rlist[j],rlist[i]]; }
  const roleMap = {};
  players.forEach((p,i) => { roleMap[p.id] = rlist[i]; });
  const rajaId = Object.keys(roleMap).find(id => roleMap[id]==='Raja');
  const chat = data.chat || [];
  chat.push({ sys:true, text:`━━ Round ${(data.round||1)+1} begins! ━━` });
  chat.push({ sys:true, text:`Raja is searching for Rani... (roles: ${roles.join(' → ')})` });
  lastChatLen = 0;
  await fbSet('rooms/'+myRoom, {
    ...data, roles:roleMap,
    stage:{ seekerId:rajaId, seeking:roles[1], foundIds:[], activeRoles:roles },
    phase:'playing', round:(data.round||1)+1, chat
  });
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.getElementById('inp-name').addEventListener('keydown', e => { if(e.key==='Enter') createRoom(); });
document.getElementById('inp-code').addEventListener('input',   e => { e.target.value = e.target.value.toUpperCase(); });
