# Dragons of Mugloar bot

A small TypeScript/Node.js client that plays the Dragons of Mugloar API game automatically.

## Approach

The player:

1. starts a new game;
2. fetches the current message board;
3. ranks missions primarily by estimated safety and secondarily by reward;
4. solves the best available mission;
5. buys healing items when lives are low and upgrades when there is enough spare gold;
6. repeats until no lives remain.

The strategy is intentionally isolated from the API client so it can be tested and tuned independently.

> Note: some versions of the game API have returned a `probability` field on messages although it is not always visible in the public documentation. The implementation treats it as optional and remains functional if the field is missing.

## Requirements

- Node.js 20+
- npm

## Run

```bash
npm install
npm run dev
```

Build and run compiled output:

```bash
npm run build
npm start
```

Tests:

```bash
npm test
```

## What I would tune from live runs

The game is probabilistic, so the exact policy should be validated against several real games. The main parameters to tune are:

- which probability categories are safe enough to accept;
- how much gold to reserve for healing;
- when upgrades become more valuable than saving gold;
- how to behave when the board contains no safe mission.

The goal is reliability rather than chasing the maximum score in one lucky run.
