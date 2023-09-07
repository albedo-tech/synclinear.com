-- AlterTable
ALTER TABLE "users" ADD COLUMN     "githubApiKey" TEXT NOT NULL,
ADD COLUMN     "githubApiKeyIV" TEXT NOT NULL,
ADD COLUMN     "linearApiKey" TEXT NOT NULL,
ADD COLUMN     "linearApiKeyIV" TEXT NOT NULL;
