# Raja Rani — The Royal Court

A browser-based multiplayer version of the classic Indian party game Raja Rani, built with React and Firebase. Create a room, share the code with friends, and play live in the browser.

## How it works

Each round, players are assigned a role from a fixed chain: Raja, Rani, Mantri, Milkman, Postman, Guard, Police, and Thief (the exact roles in play depend on how many people are in the room, from 2 up to 8). Roles are handed out as shuffled chits that everyone scrambles to claim.

Once everyone has a role, the Raja starts the search by guessing who the Rani is. Guess right, and you score your role's points and pass the search to the person you just found, who now hunts for the next role in the chain. Guess wrong, and you swap roles with whoever you picked, and they take over the search. The round ends when the Police catches the Thief, and then everyone's roles are revealed.

There's a live chat panel for trash talk during the round, and points carry across rounds so you can play a full match.

## Tech stack

- React 18 + Vite
- Firebase Realtime Database, accessed directly through its REST API rather than the JS SDK (so the only dependency is `fetch`)
- `canvas-confetti` for the celebratory bits
- Game state lives entirely in Firebase as one JSON blob per room, and clients poll it on an interval rather than using live listeners

## Running it locally

```bash
npm install
```

Create a `.env` file in the project root with your Firebase Realtime Database URL:

```
VITE_FIREBASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app/
```

Then:

```bash
npm run dev
```

For a production build:

```bash
npm run build
```

This outputs to `dist/`, which is what gets deployed (the project is set up for Netlify).

## Project structure

```
src/
  components/      shared UI pieces (chit-folding animation, chat panel, role icons)
  screens/          one component per game phase: lobby, waiting/picking, playing, reveal
  hooks/            useRajaRaniGame.js — all game logic and Firebase calls live here
  firebase.js       thin REST wrapper around the Realtime Database
```

Almost all of the actual game logic, room creation, role assignment, scoring, and turn handling sits in `useRajaRaniGame.js`. The screens are mostly just rendering whatever state that hook hands them.

## Notes

This was built as a personal project, so there's no authentication or persistence beyond a single room's lifetime. Rooms disappear once everyone leaves.
