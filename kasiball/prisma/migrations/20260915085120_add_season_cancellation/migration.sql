-- AlterEnum
ALTER TYPE "season_status" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "season" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6);
