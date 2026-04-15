/**
 * Records + Plans 主服务网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 records-core 与 plans-core 的统一适配入口
 * * 为 internal routes 与 tool 路由提供稳定服务调用面
 *
 * 主要功能：
 * * writeRecord/queryRecords/updateRecord
 * * writePlan/queryPlans/activatePlan/pausePlan/expandPlan
 *
 * 依赖：
 * * records-core
 * * plans-core
 * * protocol 协议类型
 *
 * 注意事项：
 * * 网关只做转发适配，不承载业务规则判断
 */

import type { PersistentPlansService } from "../modules/plans/services/plans.service";
import type { PersistentRecordsService } from "../modules/records/services/records.service";
import type {
  PlansActivateRequest,
  PlansExpandRequest,
  PlansExpandResponse,
  PlansPauseRequest,
  PlansQueryRequest,
  PlansQueryResponse,
  PlansWriteRequest,
  PlansWriteResponse,
  RecordsQueryRequest,
  RecordsQueryResponse,
  RecordsUpdateRequest,
  RecordsUpdateResponse,
  RecordsWriteRequest,
  RecordsWriteResponse,
} from "protocol";

/**
 * records/plans 统一网关
 */
export class RecordsPlansGateway {
  /**
   * 构造网关
   *
   * @param recordsService 记录服务
   * @param plansService 计划服务
   */
  constructor(
    private readonly recordsService: PersistentRecordsService,
    private readonly plansService: PersistentPlansService,
  ) {}

  /**
   * 写入记录
   *
   * @param req 写入请求
   * @returns 写入响应
   */
  async writeRecord(req: RecordsWriteRequest): Promise<RecordsWriteResponse> {
    return this.recordsService.write(req);
  }

  /**
   * 查询记录
   *
   * @param req 查询请求
   * @returns 查询响应
   */
  async queryRecords(req: RecordsQueryRequest): Promise<RecordsQueryResponse> {
    return this.recordsService.query(req);
  }

  /**
   * 更新记录
   *
   * @param req 更新请求
   * @returns 更新响应
   */
  async updateRecord(req: RecordsUpdateRequest): Promise<RecordsUpdateResponse> {
    return this.recordsService.update(req);
  }

  /**
   * 写入计划
   *
   * @param req 写入请求
   * @returns 写入响应
   */
  async writePlan(req: PlansWriteRequest): Promise<PlansWriteResponse> {
    return this.plansService.write(req);
  }

  /**
   * 查询计划
   *
   * @param req 查询请求
   * @returns 查询响应
   */
  async queryPlans(req: PlansQueryRequest): Promise<PlansQueryResponse> {
    return this.plansService.query(req);
  }

  /**
   * 激活计划
   *
   * @param req 激活请求
   * @returns 成功响应
   */
  async activatePlan(req: PlansActivateRequest): Promise<{ ok: true; planId: string }> {
    return this.plansService.activate(req);
  }

  /**
   * 暂停计划
   *
   * @param req 暂停请求
   * @returns 成功响应
   */
  async pausePlan(req: PlansPauseRequest): Promise<{ ok: true; planId: string }> {
    return this.plansService.pause(req);
  }

  /**
   * 展开计划
   *
   * @param req 展开请求
   * @returns 展开响应
   */
  async expandPlan(req: PlansExpandRequest): Promise<PlansExpandResponse> {
    return this.plansService.expand(req);
  }
}
