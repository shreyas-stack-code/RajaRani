import React from 'react';
import useRajaRaniGame, { 
  ROLE_DATA, 
  activeRoles, 
  roleSeeks, 
  isLastRole 
} from './hooks/useRajaRaniGame';

import LobbyScreen from './screens/LobbyScreen/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen/WaitingScreen';
import GameScreen from './screens/GameScreen/GameScreen';
import RevealScreen from './screens/RevealScreen/RevealScreen';

import './styles/global.css';

export default function App() {
  const {
    myId,
    name, setName,
    myName,
    roomCode,
    roomData,
    joinCode, setJoinCode,
    lobbyError,
    notification,
    isChitUnfolded, setIsChitUnfolded,
    isHowToPlayOpen, setIsHowToPlayOpen,
    chatInput, setChatInput,
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
  } = useRajaRaniGame();

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

  return (
    <>
      {/* Notifications toast */}
      {notification && (
        <div className="notif show" id="notif">
          {notification}
        </div>
      )}

      {/* 1. LOBBY SCREEN */}
      {activeScreen === 'lobby' && (
        <LobbyScreen
          name={name}
          setName={setName}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          createRoom={createRoom}
          joinRoom={joinRoom}
          lobbyError={lobbyError}
        />
      )}

      {/* 2. WAITING SCREEN (including Picking) */}
      {activeScreen === 'waiting' && roomData && (
        <WaitingScreen
          roomData={roomData}
          roomCode={roomCode}
          isHost={isHost}
          localShuffling={localShuffling}
          leaveRoom={leaveRoom}
          startGame={startGame}
          claimChit={claimChit}
          setIsHowToPlayOpen={setIsHowToPlayOpen}
          copyCode={copyCode}
        />
      )}

      {/* 3. GAME SCREEN */}
      {activeScreen === 'game' && roomData && myRoleData && (
        <GameScreen
          roomData={roomData}
          myId={myId}
          myRole={myRole}
          myRoleData={myRoleData}
          isLast={isLast}
          seeksRole={seeksRole}
          isMySeekerTurn={isMySeekerTurn}
          isChitUnfolded={isChitUnfolded}
          setIsChitUnfolded={setIsChitUnfolded}
          pickPlayer={pickPlayer}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChat={sendChat}
          leaveRoom={leaveRoom}
        />
      )}

      {/* 4. REVEAL SCREEN */}
      {activeScreen === 'reveal' && roomData && (
        <RevealScreen
          roomData={roomData}
          myId={myId}
          isHost={isHost}
          triggerNextRound={triggerNextRound}
          leaveRoom={leaveRoom}
        />
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
