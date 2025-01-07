import { Buffer } from "buffer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { config } from "./wagmi.ts";

import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";

import "./index.css";
import { baseUrl } from "./socket.ts";

globalThis.Buffer = Buffer;

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: baseUrl + "trpc",
      headers: {
        'Content-Type': 'application/json', // Explicitly set the content type
      },
    }),
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
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
