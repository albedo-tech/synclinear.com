-- CreateTable
CREATE TABLE "linear_team_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "linear_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linear_team_members_teamId_userId_key" ON "linear_team_members"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "linear_team_members" ADD CONSTRAINT "linear_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "linear_teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;
