import React from 'react';

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
  </svg>`,
  Milkman: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e1e2e6" />
      </linearGradient>
    </defs>
    <path d="M 35 25 L 65 25 L 65 35 L 75 45 L 75 80 C 75 85 25 85 25 80 L 25 45 L 35 35 Z" fill="url(#milkGrad)" opacity="0.9" />
    <path d="M 35 25 L 65 25 L 65 35 L 75 45 L 75 80 C 75 85 25 85 25 80 L 25 45 L 35 35 Z" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
    <path d="M 32 25 Q 50 22 68 25" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 27 55 Q 50 58 73 55" stroke="#74b9ff" stroke-width="2" fill="none" stroke-dasharray="3,3" />
    <rect x="38" y="58" width="24" height="15" rx="3" fill="#ffeaa7" stroke="#2c3e50" stroke-width="1.5" />
    <path d="M 43 65 Q 50 63 57 65" stroke="#ff7675" stroke-width="2" fill="none" stroke-linecap="round" />
  </svg>`,
  Postman: `<svg viewBox="0 0 100 100" class="pencil-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="postGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffeaa7" />
        <stop offset="100%" stop-color="#d9795b" />
      </linearGradient>
    </defs>
    <rect x="20" y="30" width="60" height="40" rx="4" fill="url(#postGrad)" opacity="0.85" stroke="#2c3e50" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 20 30 L 50 52 L 80 30" stroke="#2c3e50" stroke-width="2.5" fill="none" stroke-linejoin="round" />
    <rect x="62" y="36" width="10" height="10" fill="#ff7675" opacity="0.9" stroke="#2c3e50" stroke-width="1.2" />
    <path d="M 24 64 L 42 50 M 76 64 L 58 50" stroke="#2c3e50" stroke-width="2" fill="none" opacity="0.7" />
  </svg>`
};

export default function RoleSvg({ role }) {
  const svg = svgs[role] || '';
  return <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
