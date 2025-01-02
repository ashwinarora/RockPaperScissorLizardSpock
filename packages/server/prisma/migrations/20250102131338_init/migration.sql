-- CreateEnum
CREATE TYPE "GameState" AS ENUM ('DEPLOYED', 'J2PLAYED', 'J1WON', 'J2WON', 'DRAW', 'J2TIMEDOUT', 'J1TIMEDOUT');

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "state" "GameState" NOT NULL DEFAULT 'DEPLOYED',
    "contractAddress" TEXT NOT NULL,
    "j1Address" TEXT NOT NULL,
    "j2Address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
