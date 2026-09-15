export type winner = "j1" | "j2" | "draw";

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
  // ----------------
  joinGameError: (data: { error: string }) => void;
  gameStart: (data: {
    gameId: string
    j2Address: string
  }) => void;
  gameOver: (data: {
    winner: winner;
    isTimeout: boolean
    solveTxHash: string;
  }) => void;
  reconnectGameSuccess: (data: {
    success: boolean;
  }) => void;
  lobbyChanged: () => void;

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
  j2Ready: (data: { socketId: string; j2Address: string }) => void;
  // ----------------
  newGameCreated: (data: { gameId: number }) => void;
  joinGame: (data: {
    gameId: string
    j2Address: string
  }) => void;
  contractDeployed: (data: {
    contractAddress: string
    gameId: string
  }) => void;
  j2Played: (data: {
    gameId: string
  }) => void;
  gameOver: (data: {
    winner: winner;
    isTimeout: boolean;
    solveTxHash: string;
    gameId: string;
  }) => void;
  reconnectGame: (data: {
    gameId: string;
    playerAddress: string;
    isPlayer1: boolean;
  }) => void;
  cancelGame: (data: {
    gameId: string;
  }) => void;
}
