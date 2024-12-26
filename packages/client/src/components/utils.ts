import { encodePacked, keccak256 } from "viem";

export const MOVES = ["Rock", "Paper", "Scissors", "Spock", "Lizard"] as const;

export type Move = (typeof MOVES)[number];

export type HexString = `0x${string}`;

export const toHumanNumber = (
  value: bigint,
  decimals: number = 18,
  toFixed?: number,
): string => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const num = value / divisor;
  const remainder = value % divisor;

  const numString =
    toFixed === undefined
      ? `${num}.${remainder.toString().padStart(decimals, "0")}`
      : `${num}.${remainder.toString().padStart(decimals, "0").slice(0, toFixed)}`;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: toFixed ?? decimals,
  }).format(parseFloat(numString));
};

export const toRealNumber = (value: string, decimals: number = 18): bigint => {
  const [integerPart, fractionalPart = ""] = value.split(".");
  const paddedFraction = fractionalPart.padEnd(decimals, "0");
  return (
    BigInt(integerPart) * BigInt(10) ** BigInt(decimals) +
    BigInt(paddedFraction)
  );
};

export const getMoveNumber = (move: Move | null): number => {
  if(move === null) return 0;
  return MOVES.indexOf(move) + 1;
}

export const getHash = (move: Move, salt: bigint) => {
  const indexOfMove = getMoveNumber(move);
  const packedData = encodePacked(["uint8", "uint256"], [indexOfMove, salt]);
  const hash = keccak256(packedData);
  return hash;
};

export const getRandomSalt = (): bigint => {
  // secure random generator to create 256 bits (32 bytes)
  const randomBytes = crypto.getRandomValues(new Uint8Array(32)); 

  // Converting bytes to a hexadecimal string
  const randomHex = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  return BigInt('0x' + randomHex);
};

export const getWinner = (_c1: number, _c2: number): "j1" | "j2" | "draw" => {
  if (_c1 === _c2) {
      return "draw";
  } else if (_c1 % 2 === _c2 % 2) {
      return _c1 < _c2 ? "j1" : "j2";
  } else {
      return _c1 > _c2 ? "j1" : "j2";
  }
}