-- CreateEnum
CREATE TYPE "scoring_mode" AS ENUM ('FULL', 'DETERMINISTIC_FALLBACK');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "scoring_mode" "scoring_mode" NOT NULL DEFAULT 'FULL';
