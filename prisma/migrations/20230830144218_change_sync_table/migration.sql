-- CreateIndex
CREATE UNIQUE INDEX "syncs_githubUserId_linearUserId_githubRepoId_linearTeamId_key" ON "syncs"("githubUserId", "linearUserId", "githubRepoId", "linearTeamId");
