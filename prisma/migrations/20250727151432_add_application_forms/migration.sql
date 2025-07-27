-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DENIED');

-- CreateTable
CREATE TABLE "application_form" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "customSlug" TEXT NOT NULL,
    "whatsappInviteUrl" TEXT,
    "acceptanceMessage" TEXT,
    "denialMessage" TEXT,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_application" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "invitedAt" TIMESTAMP(3),

    CONSTRAINT "member_application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_form_communityId_key" ON "application_form"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "application_form_customSlug_key" ON "application_form"("customSlug");

-- AddForeignKey
ALTER TABLE "application_form" ADD CONSTRAINT "application_form_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_application" ADD CONSTRAINT "member_application_formId_fkey" FOREIGN KEY ("formId") REFERENCES "application_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
