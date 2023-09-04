-- AlterTable
ALTER TABLE "linear_teams" DROP COLUMN "publicLabelId";

-- AlterTable
ALTER TABLE "syncs" ADD COLUMN     "linearLabelId" TEXT NOT NULL;
