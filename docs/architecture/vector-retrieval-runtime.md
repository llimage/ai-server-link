/**
 * 向量检索运行时说明
 *
 * 所属模块：
 * * docs/architecture
 *
 * 文件作用：
 * * 说明向量检索的运行时链路与模块职责
 *
 * 主要功能：
 * * 记录 embedding provider、LanceDB、hybrid search 的职责边界
 *
 * 依赖：
 * * Search Core / Ingestion Core / Vector Store Core
 *
 * 注意事项：
 * * 本文档不包含业务领域说明
 */

# Vector Retrieval Runtime

## 本轮目标

- 为 Search Core 引入真实向量检索能力（LanceDB）
- 让 ingestion 的 index 阶段写入向量索引
- 保持 keyword + vector + hybrid 检索兼容

## 调用链

```
ingestion index
  -> DeterministicEmbedder
  -> VectorIndexWriter
  -> VectorIndexRepository
  -> LanceDbVectorStore
```

```
search.query
  -> KnowledgeKeywordSearchAdapter (keyword)
  -> LanceDbVectorSearchAdapter (vector)
  -> SearchService (hybrid merge)
```

## 模块职责

- embedding-core：提供可替换的 embedding provider 抽象
- vector-store-core：封装 LanceDB 操作
- main-server ingestion：负责 chunk 索引写入与状态联动
- main-server search：负责发布过滤与向量检索适配

## 关键约束

- Agent 不直接访问向量库
- Search Core 仍通过 Tool 暴露
- 未 publish 的知识不进入检索结果

## 后续接入

- 可替换 deterministic provider 为真实 embedding provider
- 可增加 rerank provider
- LanceDB 可替换为其他向量存储实现
