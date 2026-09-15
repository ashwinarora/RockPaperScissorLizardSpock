# Known Issues

Findings from an end-to-end test of https://rpsls-app-production.up.railway.app on 2026-09-15.
Test setup: two Chrome tabs, same MetaMask account (`0xCde0…5437`), BSC Testnet (chainId 97), stakes of 0.0000001 tBNB.

Screenshots referenced below live in `.screenshots/prod-test/` (git-ignored).

Each issue is written to be actionable for the next contributor: what happens, why, where in the code, and a concrete fix suggestion. Severity is my subjective read — recalibrate as needed.

---

## Severity: high

### 1. Host that refreshes at "Waiting for challenger" loses their game forever

**Repro**
1. Create a game (state ends up as `Waiting for a challenger…` on client, `INIT` on server).
2. Refresh the tab.
3. J1 lands back on the lobby. Their own game shows in the "Join a game" list with a `Join` button.
4. Clicking `Join` on their own game (or any other user clicking it) returns the toast `Room is full`.
5. Game is **zombie**: it stays in `INIT` for 10 minutes (see `GamesManager.getJoinableGames`, filter `createdAt > now - 10 min`) then falls off the lobby, but the DB row lingers.

**Root cause**

Server rejects reconnect for games in `INIT`:

```ts
// packages/server/src/GamesManager.ts:104
if (["INIT", "J1TIMEDOUT", "J2TIMEDOUT", "J1WON", "J2WON", "DRAW"].includes(status?.state || "")) return false
```

So when J1's socket disconnects on refresh, the server never re-associates the new socket with the room. The room now has 0 sockets. On the next `joinGame` attempt, the check on `packages/server/src/index.ts` (in the `joinGame` handler — search for `roomSize !== 1`) fails because room size is 0.

Client-side, `App.tsx:70-82` reads localStorage and enters the `reconnect` status, then `App.tsx:104-138` emits `reconnectGame`. Server returns `success: false`, client clears storage and returns to init.

**Suggested fix**

Two independent things need attention:

1. **Server**: allow `INIT` reconnects. Restore J1 socket to the room and mark the game as still-open. Only reject truly terminal states (`J1WON`, `J2WON`, `DRAW`, `J1TIMEDOUT`, `J2TIMEDOUT`, `MALACIOUSDEPLOYMENT`).
2. **Server**: when the last socket leaves an `INIT` room and doesn't come back within a short grace period (~30s), auto-mark the game as `ABANDONED`. Prevents the zombie-in-lobby state.

**Screenshot**: `13-BUG-room-full-on-own-game.png`

---

### 2. Zero-stake game creatable

**Repro**
1. Connect wallet, switch to BSC Testnet.
2. Type `0` into the stake input, tab out.
3. The `Create game` button is **enabled** and reads `Create game · 0 tBNB pot`.
4. Click — game gets created and progresses to `Waiting for a challenger…`.

**Root cause**

The disabled state is only tied to the "empty input" case, not to `parseFloat(input) <= 0`. Look in the Lobby / create-game component for the disabled condition.

- `packages/client/src/components/screens/Lobby.tsx` — likely where the create-game form lives (has `trpc.createNewGame.useMutation()` per repo grep).

**Suggested fix**

Disable the create button when `stake <= 0 || !isFinite(stake)`. Same check should live on the server tRPC mutation for defense-in-depth — reject with a validation error when `stake <= 0`.

**Screenshot**: `07-BUG-zero-stake-game.png`

---

### 3. Stake > wallet balance passes client-side validation

**Repro**
1. Wallet has 0.291 tBNB.
2. Enter `999` in the stake input.
3. Button shows `Create game · 1998 tBNB pot` — enabled.
4. Clicking would surface a MetaMask "insufficient funds" error only at signing time.

**Root cause**

No client-side balance check. wagmi has `useBalance()` already wired for the WalletChip; extend it to the stake input.

**Suggested fix**

If `stake > balance`, disable the create button and show inline copy ("Not enough tBNB — you have X"). Same on J2's `Play` button (I didn't test the J2 side, likely has the same gap).

---

### 4. Negative stake not blocked

**Repro**
1. Enter `-1` in the stake field.
2. The field gets the browser's `invalid` HTML5 flag (min=0), but the button is still enabled: `Create game · -2 tBNB pot`.

**Root cause**

Same code path as issue #2 — button disabled logic ignores negative values. `parseFloat("-1")` is a valid number so the empty-string check passes.

**Suggested fix**

Same as #2: add explicit `stake > 0` check. Also consider setting the input's `min={0}` and `step="any"` and clamping the visible value to 0.

---

## Severity: medium

### 5. Post-deploy state loss = funds locked, no recovery UI

**Repro (natural)**
1. J1 deploys the RPS contract (stake locked on-chain).
2. Before revealing, J1 clears site data / uses a different browser / their localStorage is wiped for any reason.
3. J1 has lost the `salt` and `move` and the contract address.
4. If J2 has played, J2 can call `j2Timeout` after 5 min and take both stakes. If J2 hasn't played, both sides are frozen and only J2 can `j2Timeout` (after 5 min from their play — which they'll never make). Effectively J1's stake is permanently locked.

**Reproduced accidentally in this test** during a two-tab localStorage clobber — see the note at the bottom about the test setup. The commit at deploy did succeed on-chain (`0.0000002` tBNB is stuck in an orphaned contract from game #10).

**Root cause**

- `salt` and committed move are stored client-side only (this is intentional for security — the reveal warning text says as much).
- Contract address, however, could be recovered from server state (`GamesManager` has it in DB after `contractDeployed`). But if J1 loses the salt, the address alone is useless for `solve`.
- The client has no "I've lost my browser data, help me `j1Timeout` this contract" flow.

**Suggested fix**

Two levels:

1. **Persist salt server-side, encrypted with a key only the client has** (e.g. derived from a wallet signature). Server can hand it back on reconnect after signature verification. This is a bigger design change.
2. **Cheaper mitigation**: on reconnect for a `DEPLOYED` game where the client has no salt, surface the contract address + a "call `j1Timeout` manually" flow. Won't recover pot from a played game, but recovers unplayed-J2 stakes.

Not a launch blocker for testnet play with tiny stakes, but a real footgun on mainnet.

---

### 6. Cancel does not mark the game as abandoned server-side

**Repro**
1. Create a game.
2. Click `Cancel`.
3. Server-side the game remains in `INIT` and continues to appear in the lobby for up to 10 minutes (until `getJoinableGames`' `createdAt` window falls off) or until someone else tries to join it and hits "Room is full", which triggers `markGameAsAbandoned` for that gameId.

**Root cause**

`Cancel` on the client (see the WaitPanel in `packages/client/src/components/domain/WaitPanel.tsx` for the button, then trace up) probably only calls `resetToLobby()` in `App.tsx:92-95`. There's no `socket.emit("cancelGame", ...)` or equivalent, and the server has no matching handler.

**Suggested fix**

- Add a `cancelGame` socket event (server → `GamesManager.markGameAsAbandoned(gameId)`, plus room cleanup).
- Client `Cancel` button emits it before clearing local state.
- Also: server should periodically sweep `INIT`-state games older than N minutes with no active J1 socket and mark them `ABANDONED`.

---

### 7. "Room is full" error is misleading

**Repro**
1. Trigger the join-when-host-is-gone case (see issue #1, step 4).
2. Toast reads `Room is full`.

**Root cause**

`packages/server/src/index.ts` in the `joinGame` handler emits `{ error: "Room is full" }` whenever `roomSize !== 1`. That covers both `size === 0` (host gone) and `size >= 2` (already has J2). The user-facing string treats both as "full".

**Suggested fix**

Split the two branches:

```ts
if (roomSize === 0) socket.emit("joinGameError", { error: "Host has left this game" });
else if (roomSize >= 2) socket.emit("joinGameError", { error: "Room is full" });
```

Bonus: if `roomSize === 0`, also `markGameAsAbandoned(gameId)` and stop returning it in `joinableGames`.

---

### 8. Lobby polling stale between "Play again" and next `joinableGames` fetch

**Repro**
1. Complete a game, both sides click `Play again`.
2. Tab A creates a new game (`#N+1`).
3. Tab B, freshly returned to lobby, briefly shows `No open games yet` until the next React Query poll fires (~5s).
4. During that window, if you script a `document.querySelector('button.join')` you'll bind to a stale button (or fail).

**Root cause**

`Lobby.tsx` uses `trpc.joinableGames.useQuery(...)` with default polling. No immediate refetch on returning to the lobby from a completed game.

**Suggested fix**

- Force `refetch()` when the `Lobby` screen mounts (or when `App.tsx`'s `game.status` transitions to `init`).
- OR emit a `gameCreated` broadcast on the server side so all connected clients invalidate `joinableGames` immediately. Server already knows when new games get created — hook `GamesManager.addGame` into a socket broadcast.

Not user-visible unless someone reloads at exactly the wrong instant; matters mostly for testers.

---

## Severity: low / UX polish

### 9. Chain switcher is a next-chain cycler, not a picker

**Repro**
1. Wallet is on Ethereum.
2. Click the `change` button next to the chain name.
3. It advances to the *next* chain in the list (BNB Smart Chain), not opening a picker.
4. To get to BSC Testnet from Ethereum takes 5 clicks — with an added-permissions MetaMask popup partway through.

**Root cause**

The `change` button appears to call `switchChain` with the next-index chain. Likely in a component in `packages/client/src/components/domain/` (probably `WalletChip.tsx` or similar).

**Suggested fix**

Replace with a dropdown / menu. Reown AppKit provides `useAppKitNetwork()` which can open its own chain picker (`open({ view: "Networks" })`). Reuse Reown's native picker rather than reinvent.

---

### 10. Stake input renders scientific notation

**Repro**
1. Fill `0.0000001` in stake.
2. Input's `.value` becomes `1.0000000116860974e-7` (floating-point conversion in JS).
3. Button label reads `Create game · 2e-7 tBNB pot`.

**Root cause**

Number → string conversion via `String(n)` / `n.toString()` uses scientific notation for very small numbers. The stake is being parsed as a JS `Number` somewhere (probably in the Lobby create-game handler) and rendered.

**Suggested fix**

Handle the stake as a decimal string end-to-end. `parseUnits(stakeStr, 18)` from viem converts directly to `bigint` wei without going through `Number`. For display, format with `formatUnits` or a fixed-decimal helper.

---

## Not tested (needs follow-up)

These flows exist and should get their own test pass. Each is time-consuming (5-minute wait, or requires setup I couldn't automate):

- **`j1Timeout`** — J2 stalls for 5 minutes after J1 deploys. J1 should be able to reclaim their stake. Requires ~5 min real time on BSC testnet.
- **`j2Timeout`** — J1 stalls for 5 minutes after J2 plays. J2 should be able to claim both stakes. Same 5-min wait.
- **BSC-testnet bytecode-verification guard** — `packages/server/src/index.ts` compares deployed bytecode against `RPSLS.ts` for chainId `97`. Needs a way to deploy non-RPS bytecode from the browser to trigger `MALACIOUSDEPLOYMENT`. Not reachable from the current UI, so effectively defensive-only.
- **Cross-device J2** — I only tested "same wallet, two tabs". A real two-address game across two browsers has slightly different socket lifecycle.
- **J2 insufficient balance** at `Play` time — tested only on J1's create path.
- **MetaMask account switched mid-game** — expected to break, unknown how gracefully.

---

## Test-setup note (not an app bug, but relevant)

Same-origin two-tab testing failed on the first attempt because **both tabs share `localStorage.gameState`** and clobbered each other, wiping J1's state after the deploy signature returned. That's the direct trigger of the funds-stuck situation in issue #5 above.

Worked around it by injecting an initScript into tab 2 that redirects `gameState` reads/writes to `sessionStorage`. Real users are extremely unlikely to run a J1 and a J2 in two tabs of the same browser as different addresses, so this is not a user-facing bug — but it's worth noting because:

- It made the funds-lock case (#5) reproducible in the wild if a user happens to open the same site in two tabs during a game.
- Namespacing `gameState` in localStorage per-role (or better: per-tab via `sessionStorage`, with a separate `localStorage` mirror only for reconnect after a full close) would harden the app.

Consider changing `App.tsx:68` from `const storageKey = "gameState"` to something like `${role}-${gameId}` once those are known, or moving live game state to `sessionStorage` and leaving `localStorage` only for the "last known active game" pointer used for reconnect.

---

## On-chain artifacts from this test

- Game #10 orphaned contract on BSC Testnet — J1's `0.0000002` tBNB effectively locked. Not worth recovering.
- Games #11, #12 (cancelled), #13, #14 (zombie) in the server DB. #11 and #13 are terminal. #12 and #14 remain in whatever state cleanup logic (or lack thereof) leaves them.
- Total spend: ~3 mBNB gas across ~6 transactions.
