import type { Chain } from "viem";
import { arbitrum, arbitrumSepolia, bsc, bscTestnet, mainnet, polygon, polygonMumbai, sepolia } from "wagmi/chains";

export const SUPPORTED_CHAINS = [
  mainnet,
  bsc,
  arbitrum,
  polygon,
  sepolia,
  bscTestnet,
  arbitrumSepolia,
  polygonMumbai,
] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export const TESTNET_IDS = new Set<number>([sepolia.id, bscTestnet.id, arbitrumSepolia.id, polygonMumbai.id]);

export const chainById = (id: number | string | undefined): Chain | undefined => {
  if (id === undefined) return undefined;
  const idNum = typeof id === "string" ? Number(id) : id;
  return SUPPORTED_CHAINS.find((c) => c.id === idNum);
};

export const isSupported = (id: number | undefined): boolean => {
  if (id === undefined) return false;
  return SUPPORTED_CHAINS.some((c) => c.id === id);
};

export const isTestnet = (id: number | undefined): boolean => {
  if (id === undefined) return false;
  return TESTNET_IDS.has(id);
};

/** Short display name — the wagmi chain name is fine, this is just a hook if we want overrides. */
export const chainDisplayName = (chain: Chain | undefined): string => chain?.name ?? "Unknown";

/** Block explorer tx url for a chain. */
export const explorerTxUrl = (chain: Chain | undefined, txHash: string): string | undefined => {
  const base = chain?.blockExplorers?.default?.url;
  if (!base || !txHash) return undefined;
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
};

/** Block explorer address url for a chain. */
export const explorerAddressUrl = (chain: Chain | undefined, addr: string): string | undefined => {
  const base = chain?.blockExplorers?.default?.url;
  if (!base || !addr) return undefined;
  return `${base.replace(/\/$/, "")}/address/${addr}`;
};
