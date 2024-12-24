import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, bscTestnet, bsc, arbitrum, arbitrumSepolia, polygonMumbai, polygon } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, bscTestnet, bsc, arbitrum, arbitrumSepolia, polygonMumbai, polygon],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "RPSLS - AshwinArora",
        url: "",
        iconUrl: "",
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [polygon.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
