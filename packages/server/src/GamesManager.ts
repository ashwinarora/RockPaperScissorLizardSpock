import prisma  from "./prisma";

class GamesManager {
  private static instance: GamesManager;

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
}

export default GamesManager;
