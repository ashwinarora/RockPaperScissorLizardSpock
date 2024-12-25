import { encodePacked, keccak256 } from "viem";

export const MOVES = ["Rock", "Paper", "Scissors", "Lizard", "Spock"] as const;

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

export const getMoveNumber = (move: Move): number => {
  return MOVES.indexOf(move) + 1;
}

export const getHash = (move: Move, salt: bigint) => {
  const indexOfMove = getMoveNumber(move);
  const packedData = encodePacked(["uint8", "uint256"], [indexOfMove, salt]);
  const hash = keccak256(packedData);
  return hash;
};

export const getRandomSalt = (): bigint => {
  const maxUint256 = (BigInt(1) << BigInt(256)) - BigInt(1); // 2^256 - 1
  const randomHex = Array.from({ length: 64 }) // 64 hex digits (256 bits)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  const randomBigInt = BigInt('0x' + randomHex);

  // Ensure it's within bounds (this is unlikely to exceed bounds)
  return randomBigInt <= maxUint256 ? randomBigInt : getRandomSalt();
}

export const getTimeoutString = (timeout: number) => {
  const minutes = Math.floor(timeout / 60);
  const seconds = timeout % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}