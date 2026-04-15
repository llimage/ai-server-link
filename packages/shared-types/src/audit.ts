/**
 * Audit 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义审计日志通用结构
 */

export interface AuditLogEntity {
  id: string;
  actorType: string;
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

