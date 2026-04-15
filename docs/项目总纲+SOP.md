# 项目总纲 + SOP（自动执行基线）

项目：AI Health Manager
本质：AI Runtime（RAG + Agent + Memory）

核心原则：
- 不改架构
- 不扩功能
- 一次只修一个 blocker
- 必须基于证据

Git 执行原则：
- 先 git status
- 再执行
- 再 git diff
- 再 commit
- 再 push

当前阶段：
- 第4节点（向量检索）

当前唯一 blocker：
LanceDB vectors 表不存在（写入链路未执行）
