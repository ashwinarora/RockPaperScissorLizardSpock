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
      await prisma.game.create({
        data: {
          chainId,
          stake,
          state: "INIT",
          j1Address
        }
      })
    } catch (error) {
      console.error("Error creating new game", error)
      throw new Error("Error creating new game")
    }
  }

  public async getJoinableGames()  {
    const joinableGames = await prisma.game.findMany({
      where: {
        state: "INIT"
      },
      select: {
        chainId: true,
        stake: true
      }
    })
    return joinableGames
  }
}

export default GamesManager;
