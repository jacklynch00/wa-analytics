-- AlterTable
ALTER TABLE "member_application" ADD COLUMN     "confirmationEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailDeliveryErrors" JSONB,
ADD COLUMN     "statusEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statusEmailSentAt" TIMESTAMP(3);
