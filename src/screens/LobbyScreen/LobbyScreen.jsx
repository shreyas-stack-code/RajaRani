import React from 'react';
import './LobbyScreen.css';

export default function LobbyScreen({ 
  name, 
  setName, 
  joinCode, 
  setJoinCode, 
  createRoom, 
  joinRoom, 
  lobbyError 
}) {
  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_URL;

  return (
    <div className="screen active" id="lobby">
      <span className="crown">♚</span>
      <h1 className="title">Raja Rani</h1>
      <div className="subtitle">The Royal Court · Online Multiplayer</div>
      
      {!isFirebaseConfigured && (
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
  );
}
