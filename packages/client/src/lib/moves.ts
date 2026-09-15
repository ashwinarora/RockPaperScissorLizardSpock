import type { Move } from "./game";

type MoveMeta = {
  key: Move;
  glyph: string;
  letter: string;
  beats: readonly Move[];
};

export const MOVE_META: Record<Move, MoveMeta> = {
  Rock: { key: "Rock", glyph: "✊", letter: "R", beats: ["Scissors", "Lizard"] },
  Paper: { key: "Paper", glyph: "✋", letter: "P", beats: ["Rock", "Spock"] },
  Scissors: { key: "Scissors", glyph: "✌️", letter: "S", beats: ["Paper", "Lizard"] },
  Lizard: { key: "Lizard", glyph: "🤏", letter: "L", beats: ["Spock", "Paper"] },
  Spock: { key: "Spock", glyph: "🖖", letter: "K", beats: ["Scissors", "Rock"] },
};

export const VERBS: Record<string, string> = {
  "Rock>Scissors": "crushes",
  "Rock>Lizard": "crushes",
  "Paper>Rock": "covers",
  "Paper>Spock": "disproves",
  "Scissors>Paper": "cuts",
  "Scissors>Lizard": "decapitates",
  "Lizard>Spock": "poisons",
  "Lizard>Paper": "eats",
  "Spock>Scissors": "smashes",
  "Spock>Rock": "vaporizes",
};

export const captionFor = (winner: Move, loser: Move): string => {
  const verb = VERBS[`${winner}>${loser}`] ?? "beats";
  const line = `${winner} ${verb} ${loser}.`;
  if ((winner === "Lizard" && loser === "Spock") || (winner === "Spock" && loser === "Lizard")) {
    return `${line} The one this place is named after.`;
  }
  return line;
};
