import prisma  from "./prisma.js";
import { winner } from "@rpsls/shared";

class GamesManager {
  private static instance: GamesManager;
  private _gamesMap: Map<string, {
    j1SocketId: string,
    j2SocketId: string,
    isJ1Disconnected?: boolean,
    isJ2Disconnected?: boolean,
  }> = new Map();

  private constructor() {
    console.log("GamesManager created");
  }

  public static getInstance(): GamesManager {
    if (!GamesManager.instance) {
      GamesManager.instance = new GamesManager();
    }
    return GamesManager.instance;
  }

  public async createNewGame({chainId, stake, j1Address}: {chainId: string, stake: string, j1Address: string}) { 
    try {
      const result = await prisma.game.create({
        data: {
          chainId,
          stake,
          state: "INIT",
          j1Address,
        },
        select: {
          id: true,
        }
      })
      return result
    } catch (error) {
      console.error("Error creating new game", error)
      throw new Error("Error creating new game")
    }
  }

  public async getActiveGameForAddress(address: string) {
    // Return the most recent non-terminal game where this address is J1 or J2.
    // Used to surface a "you have an in-progress game" recovery banner in the lobby
    // when the client has lost its local state (cleared site data, different browser).
    const activeStates = ["INIT", "J2JOINED", "DEPLOYED", "J2PLAYED"]
    const game = await prisma.game.findFirst({
      where: {
        state: { in: activeStates as ("INIT" | "J2JOINED" | "DEPLOYED" | "J2PLAYED")[] },
        OR: [
          { j1Address: address },
          { j2Address: address },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        chainId: true,
        stake: true,
        contractAddress: true,
        state: true,
        j1Address: true,
        j2Address: true,
      },
    })
    if (!game) return null
    return {
      ...game,
      isJ1: game.j1Address === address,
    }
  }

  public async getJoinableGames()  {
    const minutes = 10
    const joinableGames = await prisma.game.findMany({
      where: {
        state: "INIT",
        createdAt: {
          gte: new Date(Date.now() - minutes * 60 * 1000)
        }
      },
      select: {
        id: true,
        chainId: true,
        stake: true,
        updatedAt: true,
      }
    })
    // Filter out zombies: games whose J1 socket is gone (refresh without reconnect,
    // server restart, etc.). The DB row lingers as INIT but the room is empty,
    // so any join attempt would fail with "no host". Hide them from the lobby.
    return joinableGames.filter((g) => {
      const inMap = this._gamesMap.get(g.id.toString())
      return inMap && !inMap.isJ1Disconnected
    })
  }

  public get gamesMap() {
    return this._gamesMap
  }

  public getSocketsOf(gameId: string) {
    const game = this._gamesMap.get(gameId)
    if(game) {
      return game
    }
  }

  public set gamesMap(value) {
    this._gamesMap = value
  }

  public addGame({gameId, j1SocketId}: {gameId: string, j1SocketId: string}) {
    this._gamesMap.set(gameId, { j1SocketId, j2SocketId: "" })
  }

  public handleDisconnect(socketId: string) {
    for (const [_gameId, game] of this._gamesMap) {
      if (game.j1SocketId === socketId) {
        game.isJ1Disconnected = true;
      }
      if (game.j2SocketId === socketId) {
        game.isJ2Disconnected = true;
      }
    }
  }
  
  public async handleReconnection(data: {gameId: string, playerAddress: string, isPlayer1: boolean, socketId: string}) {
    const { gameId, playerAddress, isPlayer1, socketId} = data;
    const status = await prisma.game.findUnique({
      where: {
        id: Number(gameId),
        [isPlayer1 ? "j1Address" : "j2Address"]: playerAddress
      },
      select: {
        state: true,
      }
    })
    // Reject only terminal states. INIT is a valid reconnect target for the host
    // that refreshed while waiting for a challenger.
    if(["J1TIMEDOUT", "J2TIMEDOUT", "J1WON", "J2WON", "DRAW", "ABANDONED", "MALACIOUSDEPLOYMENT"].includes(status?.state || "")) return false
    if(!status) return false
    const game = this._gamesMap.get(gameId)
    if(!game) return false
    if(isPlayer1) {
      game.j1SocketId = socketId
      game.isJ1Disconnected = false
      return true
    }
    if(!isPlayer1 && game.j2SocketId) {
      game.j2SocketId = socketId
      game.isJ2Disconnected = false
      return true
    }
    return false
  }

  public async markGameAsAbandoned(gameId: string) {
    try {
      await prisma.game.update({
        where: {
          id: Number(gameId)
        },
        data: {
          state: "ABANDONED"
        }
      })
    } catch (error) {
      console.log("Error updating game state", error)
    }
  }


  public gameExists(gameId: string) {
    const game = this._gamesMap.get(gameId)
    return !!game
  }

  public async addJ2SocketIdToGame({gameId, j2SocketId, j2Address}: {gameId: string, j2SocketId: string, j2Address: string}) {
    const game = this._gamesMap.get(gameId)
    if(game) {
      game.j2SocketId = j2SocketId
      await prisma.game.update({
        where: {
          id: Number(gameId)
        },
        data: {
          state: "J2JOINED",
          j2Address: j2Address
        }
      })
    } else {
      throw new Error("Game not found")
    }
  }

  public async setGameContractAddress({gameId, contractAddress}: {gameId: string, contractAddress: string}) {
    const game = this._gamesMap.get(gameId)
    if(game) {
      try {
        const result = await prisma.game.update({
          where: {
            id: Number(gameId)
          },
          data: {
            state: "DEPLOYED",
            contractAddress
          },
          select: {
            chainId: true,
          }
        })
        return result
      } catch (error) {
        console.error("Error updating game state", error)
      }
    } else {
      throw new Error("Game not found")
    }
  }

  public async setJ2Played(gameId: string) {
    try {
      const game = this._gamesMap.get(gameId);
      if (game) {
        await prisma.game.update({
          where: {
            id: Number(gameId)
          },
          data: {
            state: "J2PLAYED"
          }
        });
      } else {
        throw new Error("Game not found");
      }
    } catch (error) {
      console.error(`Failed to set J2Played for gameId ${gameId}:`, error);
    }
  }

  public async finalizeGame(data: {winner: winner,  isTimeout: boolean, solveTxHash: string, gameId: string;}) {
    const { winner, isTimeout, gameId } = data;
    let finalState: "J1WON" | "J2WON" | "DRAW" | "J1TIMEDOUT" | "J2TIMEDOUT";
    if (isTimeout) {
      if (winner === 'j1') {
        finalState = 'J2TIMEDOUT';
      } else if (winner === 'j2') {
        finalState = 'J1TIMEDOUT';
      } else {
        throw new Error("Invalid winner for timeout");
      }
    } else {
        if (winner === 'j1') {
          finalState = 'J1WON';
        } else if (winner === 'j2') {
          finalState = 'J2WON';
        } else if (winner === 'draw') {
          finalState = 'DRAW';
        } else {
          throw new Error("Invalid winner");
        }
    }
    try {
      const game = this._gamesMap.get(gameId);
      if (game) {
        await prisma.game.update({
          where: {
            id: Number(gameId)
          },
          data: {
            state: finalState,
          }
        });
      } else {
        throw new Error("Game not found");
      }
      this._gamesMap.delete(gameId);
    } catch (error) {
      console.error(`Failed to finalize game ${gameId}:`, error);
    }

  }

}

export default GamesManager;
