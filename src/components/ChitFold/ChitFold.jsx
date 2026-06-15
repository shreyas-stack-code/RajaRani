import React from 'react';
import RoleSvg from '../RoleSvg/RoleSvg';
import './ChitFold.css';

export default function ChitFold({ 
  myRole, 
  myRoleData, 
  isLast, 
  seeksRole, 
  isChitUnfolded, 
  setIsChitUnfolded 
}) {
  return (
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
                {myRoleData?.pts} PTS
              </div>
            </div>
            <div className="chit-right">
              <div className="chit-label">Your Secret Role</div>
              <div className="rname" id="g-role">{myRole}</div>
              <div className="rdesc" id="g-desc">
                {isLast ? `You are the ${myRole} — stay hidden!` : (seeksRole ? `Find the ${seeksRole} to earn ${myRoleData?.pts} pts!` : '...')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
