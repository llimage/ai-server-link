/**
 * Ingestion 主服务网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 main-server 对 IngestionService 的调用
 *
 * 主要功能：
 * * upload
 * * parse/chunk/embed/index/publish
 *
 * 依赖：
 * * protocol ingestion 协议
 * * ingestion-core IngestionService
 *
 * 注意事项：
 * * 网关只做转发，不重复实现状态机逻辑
 */

import type {
  IngestionStageRequest,
  IngestionStageResponse,
  IngestionUploadRequest,
  IngestionUploadResponse,
} from "protocol";
import type { IngestionService } from "ingestion-core";

/**
 * 摄入网关
 */
export class IngestionGateway {
  /**
   * 构造摄入网关
   *
   * @param ingestionService 摄入服务
   */
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * 上传
   */
  async upload(req: IngestionUploadRequest): Promise<IngestionUploadResponse> {
    return this.ingestionService.upload(req);
  }

  /**
   * 解析
   */
  async parse(req: IngestionStageRequest): Promise<IngestionStageResponse> {
    return this.ingestionService.parse(req.sourceId, req.taskId);
  }

  /**
   * 切块
   */
  async chunk(req: IngestionStageRequest): Promise<IngestionStageResponse> {
    return this.ingestionService.chunk(req.sourceId, req.taskId);
  }

  /**
   * 向量化
   */
  async embed(req: IngestionStageRequest): Promise<IngestionStageResponse> {
    const profileId =
      typeof req.params?.profileId === "string" ? req.params.profileId : undefined;
    return this.ingestionService.embed(req.sourceId, req.taskId, profileId);
  }

  /**
   * 建索引
   */
  async index(req: IngestionStageRequest): Promise<IngestionStageResponse> {
    return this.ingestionService.index(req.sourceId, req.taskId);
  }

  /**
   * 发布
   */
  async publish(req: IngestionStageRequest): Promise<IngestionStageResponse> {
    return this.ingestionService.publish(req.sourceId, req.taskId);
  }
}

