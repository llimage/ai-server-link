/**
 * Search / Knowledge Runtime 说明
 *
 * 所属模块：
 * * docs/architecture
 *
 * 文件作用：
 * * 说明 Search Core 与 Knowledge Ingestion 的真实联通方式
 *
 * 主要功能：
 * * 描述 ingestion -> publish -> search 的链路
 * * 说明数据库落库与检索范围
 *
 * 依赖：
 * * main-server / ingestion-core / search-core
 *
 * 注意事项：
 * * 本阶段不接真实向量库与真实 embedding provider
 */

# Search / Knowledge Runtime 联通说明

## 1. 目标

- ingestion pipeline 与数据库表 knowledge_sources / knowledge_documents / knowledge_chunks 联动
- search.query 走真实数据库检索已发布知识
- retrieval log 落库，便于审计

## 2. 调用链路

1. `/api/admin/ingestion/*` 入口
2. `IngestionGateway -> IngestionService`
3. 数据库存储：
   - knowledge_sources.status 随 task.stage 更新
   - parse 阶段创建 knowledge_documents
   - chunk 阶段写入 knowledge_chunks
4. `/internal/search/query` 或 `search.query` tool
5. SearchService 使用数据库 keyword adapter + retrieval log sink

## 3. 数据落库说明

- knowledge_sources
  - status: uploaded / parsed / chunked / embedded / indexed / published / failed
  - metadataJson 内部包含 `_ingestion` 字段（rawText/parsedText/embeddings）
- knowledge_documents
  - parse 阶段创建
  - status 与 source 同步
- knowledge_chunks
  - chunk 阶段写入
  - 只检索 source.status = published 的内容

## 4. Search 规则

- keyword 检索基于 knowledge_chunks.chunk_text
- 过滤条件：
  - tenant_id -> knowledge_sources.tenant_id
- 仅检索 published

## 5. Retrieval Log

每次 search.query 会写入 retrieval_logs：

- query / normalizedQuery / filters
- mode / topK / resultCount
- durationMs / createdAt

## 6. 关键限制

- 本阶段不接真实向量库与 rerank 模型
- embedding 为 mock，用于保留接口位
- 不引入业务 domain 字段

