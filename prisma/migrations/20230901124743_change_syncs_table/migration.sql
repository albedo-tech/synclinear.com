/*
  Warnings:

  - You are about to drop the column `publicLabelId` on the `linear_teams` table. All the data in the column will be lost.
  - Added the required column `githubLabelId` to the `syncs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linearLabelId` to the `syncs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "linear_teams" DROP COLUMN "publicLabelId";

-- AlterTable
ALTER TABLE "syncs" ADD COLUMN     "githubLabelId" TEXT NOT NULL,
ADD COLUMN     "linearLabelId" TEXT NOT NULL;
