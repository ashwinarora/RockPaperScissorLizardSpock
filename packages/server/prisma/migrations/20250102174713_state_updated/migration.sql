/*
  Warnings:

  - A unique constraint covering the columns `[chainId,contractAddress]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameState" ADD VALUE 'INIT';
ALTER TYPE "GameState" ADD VALUE 'J2JOINED';

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_chainId_contractAddress_key" ON "Game"("chainId", "contractAddress");
