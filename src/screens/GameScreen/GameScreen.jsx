import React from 'react';
import ChitFold from '../../components/ChitFold/ChitFold';
import ChatPanel from '../../components/ChatPanel/ChatPanel';
import './GameScreen.css';

export default function GameScreen({
  roomData,
  myId,
  myRole,
  myRoleData,
  isLast,
  seeksRole,
  isMySeekerTurn,
  isChitUnfolded,
  setIsChitUnfolded,
  pickPlayer,
  chatInput,
  setChatInput,
  sendChat,
  leaveRoom
}) {
  const gameStage = roomData?.stage || {};

  return (
    <div className="screen active" id="game">
      <div className="gl">
        {/* Secret Chit Component */}
        <ChitFold
          myRole={myRole}
          myRoleData={myRoleData}
          isLast={isLast}
          seeksRole={seeksRole}
          isChitUnfolded={isChitUnfolded}
          setIsChitUnfolded={setIsChitUnfolded}
        />

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

      {/* Chat Sidebar Component */}
      <ChatPanel
        roomData={roomData}
        chatInput={chatInput}
        setChatInput={setChatInput}
        sendChat={sendChat}
        leaveRoom={leaveRoom}
      />
    </div>
  );
}
