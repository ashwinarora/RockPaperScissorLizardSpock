import type { Move } from "./game";
import { MOVE_META } from "./moves";

export type MoveCard = {
  key: Move;
  name: string;
  glyph: string;
  tagline: string;
  beats: string;
  losesTo: string;
};

const TAGLINES: Record<Move, string> = {
  Rock: "A closed fist. The blunt option.",
  Paper: "A flat hand. Quietly effective.",
  Scissors: "Two fingers. Sharp, and fragile.",
  Lizard: "A sock-puppet mouth. Beats the smart ones.",
  Spock: "The split-finger salute. Beats the physical ones.",
};

const ORDER: Move[] = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];

export const MOVE_CARDS: MoveCard[] = ORDER.map((key) => {
  const meta = MOVE_META[key];
  const losesTo = ORDER.filter((other) => MOVE_META[other].beats.includes(key));
  return {
    key,
    name: key,
    glyph: meta.glyph,
    tagline: TAGLINES[key],
    beats: `Beats ${meta.beats[0]} · ${meta.beats[1]}`,
    losesTo: `Loses to ${losesTo.join(" · ")}`,
  };
});

export type StepCopy = {
  title: string;
  body: string;
  aside: string;
  dev: string;
};

export const STEPS: StepCopy[] = [
  {
    title: "You pick a hand — nothing has left your browser yet",
    body: "Your browser generates a big random number alongside your move, called a salt. It then hashes the two together into one 32-byte fingerprint. A hash is one-way: from the fingerprint you cannot work backwards to the move.",
    aside:
      "The salt is the part people miss. There are only five possible moves, so a fingerprint of the move alone could be cracked by simply trying all five. The random salt makes that impossible.",
    dev: "salt = 256-bit CSPRNG value, kept client-side only. commitment = keccak256(abi.encodePacked(uint8 move, uint256 salt)) — the packed encoding is what the contract re-computes at reveal, so move and salt must round-trip byte-identical.",
  },
  {
    title: "The fingerprint goes on-chain with your stake",
    body: "Deploying the match publishes the fingerprint, your opponent's address, and your stake. Anyone can read all three. Nobody — not your opponent, not us, not a validator — can read your move from it.",
    aside: "This is the commitment. You are now bound to the move you picked, without having disclosed it.",
    dev: "A fresh contract is deployed per match: constructor(bytes32 c1Hash, address j2) with msg.value as the stake. No factory, no registry, no shared state between games — the match's entire lifetime is one contract address.",
  },
  {
    title: "Your opponent plays, in the clear",
    body: "They match your stake and send their move as a plain number the contract can compare later. Theirs is readable on-chain the moment it confirms — and that costs them nothing, because you're already committed and can't switch.",
    aside: "It also means you, the host, know the result before they do. You still can't do anything about it.",
    dev: "play(uint8 c2) payable, requiring msg.value == stake. c2 is written to public storage, so it's readable by eth_call or any explorer the moment the transaction confirms. Each call also stamps lastAction = block.timestamp, which is what the timeouts measure from.",
  },
  {
    title: "You reveal, and the contract pays out in the same transaction",
    body: "You send your move and your salt. The contract re-hashes them and checks the result against the fingerprint it stored at the start. Match, and it compares the hands and transfers the pot. No match, and the transaction is rejected outright.",
    aside:
      "This is the first and only moment your move becomes public — as part of the transaction that settles the game.",
    dev: "solve(uint8 c1, uint256 salt) recomputes the hash and reverts unless it equals the stored commitment; it then resolves the pair and transfers in the same call. The two escape hatches are guarded the same way: j2Timeout() and j1Timeout() both require block.timestamp > lastAction + TIMEOUT, with TIMEOUT fixed at 5 minutes.",
  },
];

export type VisibilityRow = {
  stage: string;
  label: string;
  tone: "muted" | "accent" | "warn" | "draw";
  detail: string;
};

export const VISIBILITY: VisibilityRow[] = [
  {
    stage: "Before anyone plays",
    label: "nothing",
    tone: "muted",
    detail: "No contract exists yet. The lobby entry — stake and chain — lives on our server, not the chain.",
  },
  {
    stage: "After you commit",
    label: "fingerprint only",
    tone: "accent",
    detail:
      "A 32-byte hash, your address, your opponent's address, and the stake. Your move is not derivable from any of it.",
  },
  {
    stage: "After the challenger plays",
    label: "their move",
    tone: "warn",
    detail: "Their hand is readable by anyone. Yours is still just the fingerprint.",
  },
  {
    stage: "After you reveal",
    label: "everything",
    tone: "draw",
    detail: "Both hands, the salt, the winner and the transfer — all public, in the transaction that ends the game.",
  },
];

export type Payout = {
  tag: "reveal" | "draw" | "timeout";
  tone: "accent" | "draw" | "warn";
  title: string;
  body: string;
};

export const PAYOUTS: Payout[] = [
  {
    tag: "reveal",
    tone: "accent",
    title: "Someone wins",
    body: "The contract compares the two hands and sends both stakes to the winner in the same transaction that revealed the move.",
  },
  {
    tag: "draw",
    tone: "draw",
    title: "Same hand on both sides",
    body: "Each player's stake goes back to them. No fee is taken at any point.",
  },
  {
    tag: "timeout",
    tone: "warn",
    title: "The challenger never plays",
    body: "Only the host's stake is in the contract, so the host reclaims it in full. Nothing was won or lost — just gas.",
  },
  {
    tag: "timeout",
    tone: "warn",
    title: "The host never reveals",
    body: "Both stakes are already in the contract, and the challenger claims all of it. Stalling is the most expensive mistake available.",
  },
];

export type FaqItem = { q: string; a: string; a2: string };

export const FAQ: FaqItem[] = [
  {
    q: "Can you, the person running this site, see my move?",
    a: 'No. Your move never leaves your browser until you reveal it. The server exists only to introduce the two of you and relay short game events — "a player joined", "the match is deployed", "the opponent has played". The move is not in any of those messages.',
    a2: "Nor could we do anything with it if we had it. The contract accepts a reveal only from the player who committed it, and pays strictly by its own rules.",
  },
  {
    q: "Can my opponent see my move before they choose?",
    a: "No. Before you reveal, all they have is the fingerprint, and a hash cannot be run backwards. With a random salt mixed in, guessing between five options is off the table too.",
    a2: "Note the asymmetry in the other direction: the challenger's move IS public once they play. That's safe for them because the host is already locked in.",
  },
  {
    q: "Could a validator, node, or my wallet provider see it?",
    a: "They see whatever you sign — and what you sign at commit time is the fingerprint, not the move. There is no transaction containing your move until the reveal, which is also the transaction that ends the game.",
    a2: "Your RPC provider does learn that your address is playing, and for how much. That part is public by design.",
  },
  {
    q: "Who is holding my money while we play?",
    a: "The match's own contract, deployed fresh for your game and holding nothing but the two stakes. Not us, not an exchange, not a shared pool.",
    a2: "You can watch the balance yourself on any block explorer — the contract address is shown and copyable throughout the game.",
  },
  {
    q: "Could you take the pot, or freeze it?",
    a: "There's no owner, no admin function, no upgrade switch and no pause button in the contract. It knows four ways to move money: pay the winner on reveal, split it on a draw, refund the host if the challenger never plays, and pay the challenger if the host never reveals. That's the complete list.",
    a2: "We can't add a fifth after the fact — a deployed contract's code can't be edited, and yours is deployed per match.",
  },
  {
    q: "What if my opponent just disappears?",
    a: "Every stage is protected by a five-minute on-chain timer. If the challenger never plays, you reclaim your own stake. If the host never reveals, the challenger takes both stakes. The button appears the moment the window closes.",
    a2: "Neither timeout needs us to be online, or the other player to agree. The claim is a call you make directly to the contract.",
  },
  {
    q: "What happens if I close the tab, or clear my browser data?",
    a: "Closing the tab or reloading is fine — the game restores itself when you come back. But if you're the host, the salt needed to reveal your move lives in your browser. Clear your site data before revealing and that reveal becomes impossible.",
    a2: "The consequence is real money: after five minutes your opponent can claim both stakes. So don't clear site data, use a private window, or switch devices in the middle of a match.",
  },
  {
    q: "What does it cost beyond the stake?",
    a: "Network gas, paid to the chain and not to us — there is no rake, fee or cut anywhere in the contract. Hosting costs more gas than joining does, because the host pays to deploy the match contract.",
    a2: "On a busy chain the gas can be a meaningful share of a very small stake. Worth a glance before you play for pennies.",
  },
  {
    q: "What if we both pick the same hand?",
    a: "A draw, and both stakes return to their owners in the settling transaction. You each pay your own gas; nobody profits.",
    a2: "With five hands, draws land about one game in five.",
  },
  {
    q: "Do we have to be on the same chain?",
    a: "Yes. A match lives in one contract on one chain, so both players must be connected to the chain the host created the game on. Games on other chains are marked in the lobby and can't be joined.",
    a2: "Stakes are always in that chain's native token — ETH on Ethereum, BNB on BNB Chain, and so on.",
  },
];
