export interface ServerToClientEvents {
  gameStatus: (data: {
    status: "waiting" | "j1Ready" | "j2Ready";
    j1: {
      socketId?: string;
      stake?: string;
      chainId?: string;
    };
  }) => void;
  j2Ready: (data: { j2Address: string }) => void;
  j1Deployed: (data: { contractAddress: string }) => void;
  j2Played: () => void;
  gameOver: (data: { winner: string; isTimeout: boolean }) => void;
}

export interface ClientToServerEvents {
  statusRequest: () => void;
  cleanupServer: () => void;
  j1Ready: (data: {
    socketId: string;
    stake: string;
    chainId: string;
    j1Address: string;
    move?: string;
  }) => void;
  j2Ready: (data: {
    socketId: string;
    j2Address: string;
  }) => void;
  contractDeployed: (data: { contractAddress: string }) => void;
  j2Played: () => void;
  gameOver: (data: { winner: string; isTimeout: boolean, solveTxHash: string }) => void;
}