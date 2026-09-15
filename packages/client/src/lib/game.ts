import { encodePacked, keccak256 } from "viem";

export const MOVES = ["Rock", "Paper", "Scissors", "Spock", "Lizard"] as const;

export type Move = (typeof MOVES)[number];

export type HexString = `0x${string}`;

export const toHumanNumber = (value: bigint, decimals = 18, toFixed?: number): string => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const num = value / divisor;
  const remainder = value % divisor;
  const numString =
    toFixed === undefined
      ? `${num}.${remainder.toString().padStart(decimals, "0")}`
      : `${num}.${remainder.toString().padStart(decimals, "0").slice(0, toFixed)}`;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: toFixed ?? decimals,
  }).format(Number.parseFloat(numString));
};

export const toRealNumber = (value: string, decimals = 18): bigint => {
  const [integerPart, fractionalPart = ""] = value.split(".");
  const paddedFraction = fractionalPart.padEnd(decimals, "0");
  return BigInt(integerPart) * BigInt(10) ** BigInt(decimals) + BigInt(paddedFraction);
};

export const getMoveNumber = (move: Move | undefined): number => {
  if (move === undefined) return 0;
  return MOVES.indexOf(move) + 1;
};

export const getHash = (move: Move, salt: string) => {
  const indexOfMove = getMoveNumber(move);
  const saltBigint = BigInt(salt);
  const packedData = encodePacked(["uint8", "uint256"], [indexOfMove, saltBigint]);
  return keccak256(packedData);
};

export const getRandomSalt = (): bigint => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomHex = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return BigInt(`0x${randomHex}`);
};

export const getWinner = (_c1: number, _c2: number): "j1" | "j2" | "draw" => {
  if (_c1 === _c2) return "draw";
  if (_c1 % 2 === _c2 % 2) return _c1 < _c2 ? "j1" : "j2";
  return _c1 > _c2 ? "j1" : "j2";
};

export const shortAddress = (addr?: string, head = 6, tail = 4): string => {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
};

/** Format a decimal string/number without scientific notation, trimming trailing zeros. */
export const formatAmount = (value: string | number): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || n === 0) return "0";
  const fixed = n.toFixed(18);
  return fixed.replace(/\.?0+$/, "") || "0";
};

/** Double a decimal string exactly (no floating-point drift) for pot display. */
export const doubleAmount = (value: string): string => {
  if (!value) return "0";
  const [intPart, fracPart = ""] = value.split(".");
  const scale = fracPart.length;
  const asBig = BigInt(intPart + fracPart);
  const doubled = asBig * 2n;
  const doubledStr = doubled.toString().padStart(scale + 1, "0");
  if (scale === 0) return doubledStr;
  const head = doubledStr.slice(0, -scale);
  const tail = doubledStr.slice(-scale).replace(/0+$/, "");
  return tail ? `${head}.${tail}` : head;
};
