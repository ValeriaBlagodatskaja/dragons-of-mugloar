# Dragons of Mugloar

A full-stack TypeScript implementation of the Dragons of Mugloar challenge.

The application supports both manual and automatic gameplay. In manual mode, the player can choose missions, buy shop items and use the recommended mission as decision support. Auto Play uses a risk-aware strategy to play the game automatically.

## Tech stack

- Frontend: Vue 3, TypeScript, Pinia, Vite
- Backend: Node.js, Express, TypeScript
- Testing: Vitest, Vue Test Utils, Supertest

## Approach

The automatic player:

1. Starts a new game and fetches available missions.
2. Prioritizes safe missions and chooses the highest-reward option among them.
3. Uses medium-risk missions only when no safe option is available.
4. Uses dangerous missions only as a last resort.
5. Preserves gold for healing until the 1,000-point target is reached, then buys upgrades when affordable.
6. Continues until the game ends.

The strategy is separated from the API client and game runner so it can be tested independently. The same strategy is used to highlight a **Recommended** mission in manual mode.

Local runs have exceeded the assignment target of **1,000 points**. Results vary because the game is probabilistic.

> The API may return a `probability` field for missions although it is not always visible in the public documentation. The implementation treats it as optional.

## Requirements

- Node.js 22+
- npm

## Run

Install dependencies:

```bash
npm install
cd client
npm install
cd ..
```

Start the backend:

```bash
npm run dev:server
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

The automatic player can also be run directly from the command line:

```bash
npm run dev
```

## Tests

Run all tests:

```bash
npm run test:all
```

Or separately:

```bash
npm test
npm run test:client
```

## Build

```bash
npm run build
cd client
npm run build
```

## What I would improve next

With more time, I would evaluate the strategy across a larger number of games and further tune the mission and shop decisions. For a multi-user production environment, I would also make Auto Play state session-specific instead of keeping it in memory.
