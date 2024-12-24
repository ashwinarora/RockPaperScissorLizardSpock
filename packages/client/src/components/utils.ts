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
