import GamesManager from "./GamesManager";
import { router, procedure } from "./trpc";
import { z } from 'zod';

export const appRouter = router({
  joinableGames: procedure.query(async () => {
    const joinableGames = await GamesManager.getInstance().getJoinableGames();
    return joinableGames
  }),
  createNewGame: procedure
    .input(z.object({
      chainId: z.string(),
      stake: z.string(),
      j1Address: z.string()
    })).mutation(async ({ input }) => {
      const { chainId, stake, j1Address } = input
      const result = await GamesManager.getInstance().createNewGame({ chainId, stake, j1Address })
      return {
        gameId: result.id
      }
    })
});

export type AppRouter = typeof appRouter;
