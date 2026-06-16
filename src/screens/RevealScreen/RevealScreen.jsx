import React from 'react';
import RoleSvg from '../../components/RoleSvg/RoleSvg';
import { activeRoles } from '../../hooks/useRajaRaniGame';
import './RevealScreen.css';

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

export default function RevealScreen({
  roomData,
  myId,
  isHost,
  triggerNextRound,
  leaveRoom
}) {
  const roleMap = roomData?.roles || {};
  const players = roomData?.players || [];
  const stage = roomData?.stage || {};
  const roles = stage.activeRoles || activeRoles(players.length);
  
  const lastRole = roles[roles.length - 1];
  const lastRoleId = Object.keys(roleMap).find(id => roleMap[id] === lastRole);
  const lastP = players.find(p => p.id === lastRoleId);
  
  const prevRole = roles[roles.length - 2];
  const prevId = Object.keys(roleMap).find(id => roleMap[id] === prevRole);
  const prevP = players.find(p => p.id === prevId);

  const currentRound = roomData?.round || 1;
  ensureHistory(players, currentRound);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen active" id="reveal">
      <div className="rtitle">Round Over!</div>
      <div className="rsub" id="rresult">
        {`${prevP ? prevP.name : prevRole} found ${lastP ? lastP.name : 'them'} (the ${lastRole})!`}
      </div>

      <div className="rcards" id="rcards">
        {roles.map((role) => {
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
        })}
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
  );
}
