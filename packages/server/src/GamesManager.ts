import e from "express";
import prisma  from "./prisma";

class GamesManager {
  private static instance: GamesManager;
  private _gamesMap: Map<string, {
    j1SocketId: string,
    j2SocketId: string,
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

  public async getJoinableGames()  {
    const minutes = 5
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
    return joinableGames
  }

  public get gamesMap() {
    return this._gamesMap
  }

  public set gamesMap(value) {
    this._gamesMap = value
  }

  public addGame({gameId, j1SocketId}: {gameId: string, j1SocketId: string}) {
    this._gamesMap.set(gameId, { j1SocketId, j2SocketId: "" })
  }

  public async removeGameByJ1SocketId(j1SocketId: string) {
    const gameId =  Array.from(this._gamesMap.keys()).find(key => this._gamesMap.get(key)?.j1SocketId === j1SocketId)
    if(gameId) {
      this._gamesMap.delete(gameId)
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
    return gameId
  }

  public gameExists(gameId: string) {
    console.log(this._gamesMap)
    const game = this._gamesMap.get(gameId)
    console.log("game is", game)
    return !!game
  }

  public async addJ2SocketIdToGame({gameId, j2SocketId}: {gameId: string, j2SocketId: string}) {
    const game = this._gamesMap.get(gameId)
    if(game) {
      game.j2SocketId = j2SocketId
    } else {
      throw new Error("Game not found")
    }
  }

}

export default GamesManager;
