-- CreateTable
CREATE TABLE "ingestion_tasks" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrieval_logs" (
    "id" TEXT NOT NULL,
    "space" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized_query" TEXT NOT NULL,
    "filters_json" JSONB,
    "mode" TEXT NOT NULL,
    "top_k" INTEGER NOT NULL,
    "result_count" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrieval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingestion_tasks_source_id_idx" ON "ingestion_tasks"("source_id");

-- CreateIndex
CREATE INDEX "ingestion_tasks_stage_idx" ON "ingestion_tasks"("stage");

-- CreateIndex
CREATE INDEX "ingestion_logs_task_id_idx" ON "ingestion_logs"("task_id");

-- CreateIndex
CREATE INDEX "ingestion_logs_source_id_idx" ON "ingestion_logs"("source_id");

-- CreateIndex
CREATE INDEX "ingestion_logs_stage_idx" ON "ingestion_logs"("stage");

-- CreateIndex
CREATE INDEX "retrieval_logs_space_idx" ON "retrieval_logs"("space");

-- CreateIndex
CREATE INDEX "retrieval_logs_mode_idx" ON "retrieval_logs"("mode");
