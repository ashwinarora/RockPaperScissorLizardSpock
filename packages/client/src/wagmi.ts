import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrum, arbitrumSepolia, bsc, bscTestnet, mainnet, polygon, polygonMumbai, sepolia } from "wagmi/chains";

const rawProjectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;
if (!rawProjectId) {
  throw new Error(
    "VITE_REOWN_PROJECT_ID is not set. Get one at https://dashboard.reown.com and add it to packages/client/.env.local",
  );
}
const projectId: string = rawProjectId;

export const networks = [mainnet, sepolia, bscTestnet, bsc, arbitrum, arbitrumSepolia, polygonMumbai, polygon] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  ssr: false,
});

export const config = wagmiAdapter.wagmiConfig;

export { projectId };

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
