# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Yarn v4 workspaces monorepo (`packageManager: yarn@4.5.3`) with four packages under `packages/`:

- `@rpsls/contract` — Solidity 0.4.26 contract `RPS.sol` compiled via Hardhat. `packages/contract/index.ts` re-exports the compiled artifact (`artifacts/contracts/RPS.sol/RPS.json`), so the client/server depend on `yarn compileContracts` having run before typecheck/build.
- `@rpsls/server` — Express + Socket.IO + tRPC on Node (ESM, `tsx`). Prisma (Postgres) for game persistence. Also serves the built client from `../../client/dist` in production.
- `@rpsls/client` — Vite + React 18 + Tailwind. Wagmi/viem for wallet + on-chain calls, tRPC + React Query for HTTP, `socket.io-client` for realtime. Biome for lint.
- `@rpsls/shared` — plain TS module (`index.ts`) with the Socket.IO `ClientToServerEvents` / `ServerToClientEvents` contract. No build step.

## Common commands

Run everything from the repo root unless noted.

```bash
yarn install
yarn compileContracts           # required before server/client typecheck — generates artifacts/ used by @rpsls/contract
yarn server:dev                 # tsx watch on packages/server/src/index.ts, listens on :3000
yarn client:dev                 # vite dev server on :5173 (server CORS is hard-coded to this origin)
yarn client:build               # tsc + vite build
yarn server:build               # prisma generate + tsc
yarn start                      # compileContracts && client:build && server:build && server:start (prod-style)
```

Package-scoped:

```bash
yarn workspace @rpsls/client lint          # biome check .
yarn workspace @rpsls/contract compile     # hardhat compile
yarn workspace @rpsls/server exec prisma migrate dev   # apply/create migrations (needs DATABASE_URL)
```

The server needs `DATABASE_URL` (Postgres) in the environment; Prisma schema is at `packages/server/prisma/schema.prisma`.

## Architecture

Rock-Paper-Scissors-Lizard-Spock played for real ETH on an EVM chain. A fresh `RPS` contract is deployed per game and destroys itself after `solve`/timeout, so contract addresses are single-use. Two off-chain systems coordinate around it.

### Game flow (why the pieces exist)

1. **J1 (creator)** calls the `createNewGame` tRPC mutation → server inserts a `Game` row (`state=INIT`) and returns `gameId`. Client emits `newGameCreated` over Socket.IO to register the J1 socket in a room named after `gameId`.
2. **J2 (joiner)** fetches `joinableGames` (tRPC) and emits `joinGame`. Server enforces one J2 per room and marks state `J2JOINED`. Both sockets receive `gameStart`.
3. **J1** deploys `RPS.sol` from the browser (via wagmi) with `keccak256(move, salt)` as the commit + J2's address as constructor args, staking ETH. Emits `contractDeployed`. Server updates state to `DEPLOYED` and (for BSC testnet, chainId `97`) verifies the on-chain bytecode against the compiled `deployedBytecode` — mismatch → game is force-ended as `draw` (the "malicious deployment protection" guard in `server/src/index.ts`).
4. **J2** calls `play(move)` on the contract (stakes ETH), emits `j2Played`. State → `J2PLAYED`.
5. **J1** calls `solve(move, salt)` revealing the commitment. Client-side determines the winner and emits `gameOver`, which the server relays to the opponent and persists as `J1WON` / `J2WON` / `DRAW` / `J1TIMEDOUT` / `J2TIMEDOUT`. Either party can instead call `j1Timeout` / `j2Timeout` on the contract after 5 minutes of inaction.

### Server (`packages/server/src`)

- `index.ts` wires Express, Socket.IO (CORS `http://localhost:5173`), the tRPC middleware at `/trpc`, and static hosting of `client/dist`. All realtime handlers live here.
- `GamesManager.ts` — singleton. Holds an **in-memory** `Map<gameId, {j1SocketId, j2SocketId, isJ1Disconnected, isJ2Disconnected}>` for socket routing, and persists lifecycle state to Postgres via Prisma. `handleReconnection` uses the persisted `state` to decide whether a reconnect is still valid (rejects any terminal state). Since the map is per-process, horizontal scaling would need a shared store (Redis/etc.).
- `router.ts` — tRPC `appRouter` with just `joinableGames` (query) and `createNewGame` (mutation). Exported `AppRouter` type is imported by the client via `@rpsls/server/src/router` for end-to-end type safety.
- `RPSLS.ts` — the compiled deployed bytecode string used for the on-chain equality check. Regenerate whenever `RPS.sol` changes.
- `prisma/schema.prisma` — `Game` model + `GameState` enum. Note the enum value `MALACIOUSDEPLOYMENT` (typo preserved in the schema; changing it requires a migration).

### Shared event contract (`packages/shared/index.ts`)

Single source of truth for the socket protocol. Both client and server import `ClientToServerEvents` / `ServerToClientEvents` from `@rpsls/shared`. Adding a new event = update this file first.

### Client (`packages/client/src`)

- `App.tsx` owns the `gameState` union (`gameJ1 | gameJ2`) and persists it to `localStorage` under `gameState` so refreshes / disconnects can resume via the `reconnectGame` socket event. Terminal / pre-game statuses clear storage.
- Two role-specific components render most of the flow: `J1Game.tsx` and `J2Game.tsx`. `MakeMove.tsx`, `TxButton.tsx`, `Timeout.tsx`, `useTimer.ts` are shared UI primitives.
- `wagmi.ts` — chains list (mainnet, sepolia, bscTestnet, bsc, arbitrum, arbitrumSepolia, polygonMumbai, polygon) with MetaMask connector.
- `trpc.ts` / `socket.ts` — client factories. `socket.ts` picks `RAILWAY_PUBLIC_DOMAIN` in production, otherwise `http://localhost:3000/`.
- Lint is Biome (`biome.json`), not ESLint.

### Contract (`packages/contract`)

`RPS.sol` is fixed to Solidity 0.4.26 (`hardhat.config.ts`). `TIMEOUT = 5 minutes` on-chain — keep any client-side timer in sync. `packages/contract/index.ts` is the only intended entrypoint for other packages; it re-exports the Hardhat artifact JSON, so callers get ABI + bytecode without depending on Hardhat internals.

## Gotchas

- Running `yarn client:build` or `yarn server:build` before `yarn compileContracts` fails: `@rpsls/contract` imports `./artifacts/...` which only exists after Hardhat compile.
- Server CORS and the client's dev URL are hard-coded to `http://localhost:5173` / `http://localhost:3000`. Change both if you move ports.
- The on-chain bytecode check only runs for chainId `97` (BSC testnet). If you add another chain, update `index.ts` and regenerate `RPSLS.ts` per-chain if compiler settings differ.
- `GamesManager` state lives in process memory — restarting the server drops all active socket routing (persisted DB state survives, but in-flight games can't reconnect).
