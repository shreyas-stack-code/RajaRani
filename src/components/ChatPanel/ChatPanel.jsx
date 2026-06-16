import React, { useEffect, useRef } from 'react';
import './ChatPanel.css';

export default function ChatPanel({ 
  roomData, 
  chatInput, 
  setChatInput, 
  sendChat, 
  leaveRoom 
}) {
  const chatEndRef = useRef(null);

  // Auto scroll chat to the bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [roomData?.chat]);

  return (
    <div className="gr">
      <div className="chat-panel">
        <div className="ch">
          <span>Royal Messenger ✦</span>
          <button className="leave-btn" onClick={leaveRoom}>Leave Game</button>
        </div>
        <div className="cm" id="cm" ref={chatEndRef}>
          {(roomData?.chat || []).map((msg, idx) => {
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
  );
}
