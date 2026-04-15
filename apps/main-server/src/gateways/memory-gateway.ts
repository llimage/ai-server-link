/**
 * Memory 主服务网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 user metadata 与 memory 服务的内部调用
 *
 * 主要功能：
 * * writeUserMeta
 * * queryUserMeta
 * * writeMemory
 * * searchMemory
 * * summarizeMemory
 *
 * 依赖：
 * * memory-core services
 * * protocol 协议
 *
 * 注意事项：
 * * 网关仅做适配，不直接访问底层 store
 */

import type {
  MemorySearchRequest,
  MemorySearchResponse,
  MemorySummarizeRequest,
  MemorySummarizeResponse,
  MemoryWriteRequest,
  MemoryWriteResponse,
  UserMetaQueryRequest,
  UserMetaQueryResponse,
  UserMetaWriteRequest,
  UserMetaWriteResponse,
} from "protocol";
import type { PersistentMemoryService } from "../modules/memory/services/memory.service";
import type { PersistentUserMetaService } from "../modules/user-meta/services/user-meta.service";

export class MemoryGateway {
  /**
   * 构造 memory 网关
   *
   * @param userMetaService 用户元数据服务
   * @param memoryService 记忆服务
   * @param summaryService 摘要服务
   */
  constructor(
    private readonly userMetaService: PersistentUserMetaService,
    private readonly memoryService: PersistentMemoryService,
  ) {}

  /**
   * 写用户元数据
   */
  async writeUserMeta(req: UserMetaWriteRequest): Promise<UserMetaWriteResponse> {
    return this.userMetaService.write(req);
  }

  /**
   * 查用户元数据
   */
  async queryUserMeta(req: UserMetaQueryRequest): Promise<UserMetaQueryResponse> {
    return this.userMetaService.query(req);
  }

  /**
   * 写记忆
   */
  async writeMemory(req: MemoryWriteRequest): Promise<MemoryWriteResponse> {
    return this.memoryService.write(req);
  }

  /**
   * 搜记忆
   */
  async searchMemory(req: MemorySearchRequest): Promise<MemorySearchResponse> {
    return this.memoryService.search(req);
  }

  /**
   * 摘要记忆
   */
  async summarizeMemory(
    req: MemorySummarizeRequest,
  ): Promise<MemorySummarizeResponse> {
    return this.memoryService.summarize(req);
  }
}
