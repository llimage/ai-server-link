# Persistence And Runtime Storage

## 1. 本轮目标

本轮定位为 Server 第 2 节点：数据库结构与持久化骨架定型。

核心目标：
- 统一 Prisma schema
- 建立 repository 分层
- 为 runtime/model/tool 日志落库提供结构
- 为 records/plans/user-meta/memory 持久化切换做准备
- 接入 Redis 基础缓存能力

## 2. 表结构概览

### 用户与会话
- `users`
- `sessions`

### Runtime 与审计
- `runs`
- `run_events`
- `tool_call_logs`
- `model_invoke_logs`
- `audit_logs`

### 用户上下文
- `user_metadata_records`
- `memory_records`
- `memory_summaries`

### 动作数据
- `records`
- `plans`
- `plan_runs`

### Knowledge 基础结构
- `knowledge_sources`
- `knowledge_documents`
- `knowledge_chunks`

### 存储与导出
- `stored_files`
- `export_jobs`

## 3. Repository 分层

约束：
- controller 不直接操作 Prisma
- service 只依赖 repository
- repository 只负责数据库访问，不承载业务编排

当前已建立：
- `RunRepository`
- `RunEventRepository`
- `ToolCallLogRepository`
- `ModelInvokeLogRepository`
- `AuditLogRepository`
- `UserMetaRepository`
- `MemoryRepository`
- `RecordsRepository`
- `PlansRepository`
- `KnowledgeRepository`
- `StoredFileRepository`
- `ExportJobRepository`

## 4. Runtime / Model / Tool 日志关系

- `runs`：run 主状态
- `run_events`：run 生命周期事件流
- `model_invoke_logs`：模型调用记录（attempts/usage/latency）
- `tool_call_logs`：工具调用记录（args/result/status）

这四类日志共同构成一次 run 的审计闭环。

## 5. Redis 边界

本轮 Redis 只承担：
- session 短期缓存
- run 数据短期缓存
- run 状态短期缓存

不承担：
- reminder queue
- 分布式任务调度
- 长期存储

## 6. 结构设计说明

`records/plans/meta/memory` 均保持通用结构：
- `space/type/payload/metadata` 或 `key/value` 风格
- 避免引入业务领域绑定字段
- 为后续 Agent Tool 与跨场景复用保留弹性

## 7. 下一轮衔接

下一轮可在当前骨架上推进：
- Search/Knowledge 真索引接入
- model/tool/run 日志自动挂接到主链路
- 内存 store 到 repository 的完整替换
- Redis 从内存占位替换为真实客户端

