import React from 'react';
import { activeRoles } from '../../hooks/useRajaRaniGame';
import './WaitingScreen.css';

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

export default function WaitingScreen({
  roomData,
  roomCode,
  isHost,
  localShuffling,
  leaveRoom,
  startGame,
  claimChit,
  setIsHowToPlayOpen,
  copyCode
}) {
  return (
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

        {/* Bowl Container */}
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
          {(roomData.phase === 'picking' || roomData.phase === 'shuffling') && !localShuffling && (
            <div id="picking-area-container" style={{
              position: 'absolute',
              inset: 0,
              width: '100%'
            }}>
              <div className="scattered-chits-container" style={{ marginTop: 0 }}>
                <div className="scattered-chits" id="waiting-scattered-chits">
                  {(roomData.chits || []).map((c, idx) => {
                    const posIndex = c.posIdx !== undefined ? c.posIdx : idx;
                    const pos = SCATTERED_CHIT_POSITIONS[posIndex % SCATTERED_CHIT_POSITIONS.length];
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

          {/* Shuffling pour/gravity scatter */}
          {localShuffling && (
            <div id="picking-area-container" style={{
              position: 'absolute',
              inset: 0,
              width: '100%'
            }}>
              <div className="scattered-chits-container">
                <div className="scattered-chits">
                  {(roomData.chits || []).map((c, idx) => {
                    const posIndex = c.posIdx !== undefined ? c.posIdx : idx;
                    const pos = SCATTERED_CHIT_POSITIONS[posIndex % SCATTERED_CHIT_POSITIONS.length];
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
  );
}
