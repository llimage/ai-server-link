-- AlterTable
ALTER TABLE "retrieval_logs" ADD COLUMN     "keyword_hit_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "merged_hit_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vector_hit_count" INTEGER NOT NULL DEFAULT 0;
