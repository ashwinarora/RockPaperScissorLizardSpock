import { Buffer } from "buffer";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { config, networks, projectId, wagmiAdapter } from "./wagmi.ts";

import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";

import "./index.css";

globalThis.Buffer = Buffer;

createAppKit({
  adapters: [wagmiAdapter],
  networks: [...networks],
  projectId,
  metadata: {
    name: "RPSLS",
    description: "Rock-Paper-Scissors-Lizard-Spock on-chain",
    url: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
    icons: [],
  },
  features: {
    email: false,
    socials: false,
    analytics: true,
  },
});

const queryClient = new QueryClient();

export const url = import.meta.env.MODE === "production" ? "trpc" : "http://localhost:3000/trpc";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: url,
      headers: {
        "Content-Type": "application/json", // Explicitly set the content type
      },
    }),
  ],
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </WagmiProvider>
  </React.StrictMode>,
);
