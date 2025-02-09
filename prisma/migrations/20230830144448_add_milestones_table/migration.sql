-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "cycleId" TEXT NOT NULL,
    "githubRepoId" INTEGER NOT NULL,
    "linearTeamId" TEXT NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "milestones_milestoneId_githubRepoId_cycleId_linearTeamId_key" ON "milestones"("milestoneId", "githubRepoId", "cycleId", "linearTeamId");

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_githubRepoId_fkey" FOREIGN KEY ("githubRepoId") REFERENCES "github_repos"("repoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_linearTeamId_fkey" FOREIGN KEY ("linearTeamId") REFERENCES "linear_teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;
