/**
 * Ingestion Core 涓荤紪鎺掓湇鍔? *
 * 鎵€灞炴ā鍧楋細
 * * ingestion-core
 *
 * 鏂囦欢浣滅敤锛? * * 涓茶仈 upload/parse/chunk/embed/index/publish 鍏ㄩ樁娈垫祦绋? *
 * 涓昏鍔熻兘锛? * * upload
 * * parse
 * * chunk
 * * embed
 * * index
 * * publish
 *
 * 渚濊禆锛? * * protocol ingestion 鍗忚
 * * ingestion store/log/state
 * * parser/chunker/embedder/indexer/publisher
 * * search-core profile
 *
 * 娉ㄦ剰浜嬮」锛? * * 涓ユ牸鎵ц鐘舵€佹満锛屼笉鍏佽璺抽樁娈? */

import { randomUUID } from "node:crypto";
import type {
  IngestionStageRequest,
  IngestionStageResponse,
  IngestionUploadRequest,
  IngestionUploadResponse,
} from "protocol";
import { getDefaultSearchProfile, type SearchProfile } from "search-core";
import { chunkText } from "./chunker/chunker";
import type { Embedder } from "./embedder/embedder";
import { assertValidIngestionTransition } from "./ingestion-state";
import type { IngestionLogSink } from "./ingestion-log";
import type { IngestionTaskStore } from "./ingestion-task-store";
import type { IngestionStage, IngestionTask, KnowledgeSourceRecord } from "./ingestion-types";
import type { Indexer } from "./indexer/indexer";
import type { TextParser } from "./parser/text-parser";
import type { Publisher } from "./publisher/publisher";
import type { KnowledgeSourceStore } from "./source-store";

/**
 * IngestionService 渚濊禆闆嗗悎
 */
export interface IngestionServiceDeps {
  taskStore: IngestionTaskStore;
  sourceStore: KnowledgeSourceStore;
  logSink: IngestionLogSink;
  parser: TextParser;
  embedder: Embedder;
  indexer: Indexer;
  publisher: Publisher;
  searchProfileProvider?: (profileId?: string) => SearchProfile;
}

/**
 * 鎽勫叆缂栨帓鏈嶅姟
 */
export class IngestionService {
  /**
   * 鏋勯€犳湇鍔?   *
   * @param deps 渚濊禆闆嗗悎
   */
  constructor(private readonly deps: IngestionServiceDeps) {}

  /**
   * 涓婁紶鐭ヨ瘑婧?   *
   * @param req 涓婁紶璇锋眰
   * @returns 涓婁紶鍝嶅簲
   */
  async upload(req: IngestionUploadRequest): Promise<IngestionUploadResponse> {
    const sourceId = req.sourceId ?? `src_${randomUUID()}`;
    const taskId = `task_${randomUUID()}`;
    const now = new Date().toISOString();

    try {
      const source: KnowledgeSourceRecord = {
        sourceId,
        rawText: req.rawText,
        fileUri: req.fileUri,
        mimeType: req.mimeType,
        metadata: req.metadata,
        createdAt: now,
        updatedAt: now,
      };
      const task: IngestionTask = {
        taskId,
        sourceId,
        stage: "uploaded",
        createdAt: now,
        updatedAt: now,
      };
      await this.deps.sourceStore.set(source);
      await this.deps.taskStore.set(task);
      await this.writeLog(task, "uploaded");
      return { sourceId, taskId, status: "uploaded" };
    } catch (error) {
      return {
        sourceId,
        taskId,
        status: "failed",
        message: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * 鎵ц parse 闃舵
   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @returns 闃舵鍝嶅簲
   */
  async parse(sourceId: string, taskId: string): Promise<IngestionStageResponse> {
    return this.runStage(sourceId, taskId, "parsed", async (source) => {
      const parsedText = await this.deps.parser.parse(source);
      source.parsedText = parsedText;
    });
  }

  /**
   * 鎵ц chunk 闃舵
   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @returns 闃舵鍝嶅簲
   */
  async chunk(sourceId: string, taskId: string): Promise<IngestionStageResponse> {
    return this.runStage(sourceId, taskId, "chunked", async (source) => {
      const profile = this.resolveProfile();
      const parsedText = source.parsedText?.trim();
      if (!parsedText) {
        throw new Error("Source parsedText is empty");
      }
      const chunks = chunkText(parsedText, {
        targetTokens: profile.chunk.targetTokens,
        overlapTokens: profile.chunk.overlapTokens,
      });
      if (!chunks.length) {
        throw new Error("Chunking produced empty result");
      }
      source.chunks = chunks;
    });
  }

  /**
   * 鎵ц embed 闃舵
   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @param profileId 閰嶇疆 ID
   * @returns 闃舵鍝嶅簲
   */
  async embed(
    sourceId: string,
    taskId: string,
    profileId?: string,
  ): Promise<IngestionStageResponse> {
    return this.runStage(sourceId, taskId, "embedded", async (source) => {
      if (!source.chunks || !source.chunks.length) {
        throw new Error("Source chunks are empty");
      }
      const vectors = await this.deps.embedder.embed(source.chunks, profileId);
      source.embeddings = vectors;
    });
  }

  /**
   * 鎵ц index 闃舵
   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @returns 闃舵鍝嶅簲
   */
  async index(sourceId: string, taskId: string): Promise<IngestionStageResponse> {
    return this.runStage(sourceId, taskId, "indexed", async (source) => {
      if (!source.chunks?.length || !source.embeddings?.length) {
        throw new Error("Source chunks or embeddings are empty");
      }
      await this.deps.indexer.index({
        sourceId: source.sourceId,
        chunks: source.chunks,
        embeddings: source.embeddings,
        metadata: source.metadata,
      });
      source.indexed = true;
    });
  }

  /**
   * 鎵ц publish 闃舵
   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @returns 闃舵鍝嶅簲
   */
  async publish(sourceId: string, taskId: string): Promise<IngestionStageResponse> {
    return this.runStage(sourceId, taskId, "published", async (source) => {
      await this.deps.publisher.publish(source.sourceId);
      source.published = true;
    });
  }

  /**
   * 閫氱敤闃舵鎵ц鍣?   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @param taskId 浠诲姟 ID
   * @param targetStage 鐩爣闃舵
   * @param mutator 瀵?source 鐨勫彉鏇存搷浣?   * @returns 闃舵鍝嶅簲
   */
  private async runStage(
    sourceId: string,
    taskId: string,
    targetStage: Exclude<IngestionStage, "uploaded" | "failed">,
    mutator: (source: KnowledgeSourceRecord) => Promise<void>,
  ): Promise<IngestionStageResponse> {
    const task = await this.mustGetTask(taskId);
    const source = await this.mustGetSource(sourceId);

    if (task.sourceId !== sourceId) {
      return this.failStage(task, source, "Task source mismatch");
    }

    try {
      assertValidIngestionTransition(task.stage, targetStage);
      await mutator(source);
      source.updatedAt = new Date().toISOString();
      await this.deps.sourceStore.set(source);

      task.stage = targetStage;
      task.updatedAt = new Date().toISOString();
      task.errorMessage = undefined;
      await this.deps.taskStore.set(task);
      await this.writeLog(task, targetStage);
      return {
        sourceId,
        taskId,
        status: targetStage,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? [error.message, error.stack].filter(Boolean).join("\n")
          : "Stage failed";
      return this.failStage(
        task,
        source,
        message,
      );
    }
  }

  /**
   * 闃舵澶辫触澶勭悊
   *
   * @param task 鎽勫叆浠诲姟
   * @param source 鐭ヨ瘑婧愯褰?   * @param message 閿欒淇℃伅
   * @returns 闃舵鍝嶅簲
   */
  private async failStage(
    task: IngestionTask,
    source: KnowledgeSourceRecord,
    message: string,
  ): Promise<IngestionStageResponse> {
    task.stage = "failed";
    task.updatedAt = new Date().toISOString();
    task.errorMessage = message;
    source.updatedAt = new Date().toISOString();
    await this.deps.taskStore.set(task);
    await this.deps.sourceStore.set(source);
    await this.writeLog(task, "failed", message);
    return {
      sourceId: source.sourceId,
      taskId: task.taskId,
      status: "failed",
      message,
    };
  }

  /**
   * 璇诲彇 profile
   *
   * @param profileId 閰嶇疆 ID
   * @returns SearchProfile
   */
  private resolveProfile(profileId?: string): SearchProfile {
    return this.deps.searchProfileProvider?.(profileId) ?? getDefaultSearchProfile();
  }

  /**
   * 蹇呴』鑾峰彇浠诲姟
   *
   * @param taskId 浠诲姟 ID
   * @returns 浠诲姟
   */
  private async mustGetTask(taskId: string): Promise<IngestionTask> {
    const task = await this.deps.taskStore.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  }

  /**
   * 蹇呴』鑾峰彇鐭ヨ瘑婧?   *
   * @param sourceId 鐭ヨ瘑婧?ID
   * @returns 鐭ヨ瘑婧?   */
  private async mustGetSource(sourceId: string): Promise<KnowledgeSourceRecord> {
    const source = await this.deps.sourceStore.get(sourceId);
    if (!source) {
      throw new Error("Source not found");
    }
    return source;
  }

  /**
   * 鍐欏叆鏃ュ織
   *
   * @param task 浠诲姟
   * @param stage 闃舵
   * @param message 闄勫姞娑堟伅
   * @returns void
   */
  private async writeLog(
    task: IngestionTask,
    stage: IngestionStage,
    message?: string,
  ): Promise<void> {
    await this.deps.logSink.write({
      ts: new Date().toISOString(),
      taskId: task.taskId,
      sourceId: task.sourceId,
      stage,
      message,
    });
  }
}
