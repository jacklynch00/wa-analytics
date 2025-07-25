/*
  Warnings:

  - Added the required column `communityId` to the `chat_analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityId` to the `member_directory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `member_directory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chat_analysis" ADD COLUMN     "communityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "member_directory" ADD COLUMN     "communityId" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "chatAnalysisId" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "community" ADD CONSTRAINT "community_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_analysis" ADD CONSTRAINT "chat_analysis_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_directory" ADD CONSTRAINT "member_directory_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
