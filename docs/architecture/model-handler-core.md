# Model Handler Core

## 1. 模块职责

Model Handler Core 是通用模型运行时层，负责统一模型目录、选模路由、provider 适配、重试与回退，不承载任何业务域逻辑。

- `packages/shared-types/src/model`：跨模块共享模型类型
- `packages/model-core`：模型核心编排（catalog/router/invoke/policy/provider）
- `apps/main-server/src/modules/model`：internal API 模块（controller/service/dto）
- `apps/agent-runtime/src/model-client`：agent 侧 model internal API 客户端

## 2. 调用链

固定调用链如下：

1. `agent-runtime` 触发普通对话
2. `agent-runtime/model-client` 调用 main-server internal API
3. `POST /internal/model/invoke` 或 `POST /internal/model/invoke/stream`
4. `main-server/model-gateway` 进入 `model-core`
5. `model-core` 通过 provider adapter 执行调用
6. 返回标准 stream events（`delta/done/error`）
7. `agent-runtime` 转发为运行时事件（`message.delta`、`run.completed`、`run.failed`）

## 3. 关键类型

共享类型位于 `packages/shared-types/src/model/index.ts`：

- `ModelDescriptor`
- `ModelInvokeRequest`
- `ModelInvokeResponse`
- `ModelStreamEvent`
- `ModelRoutingPreference`
- `ModelSelectionResult`

协议层通过 `packages/protocol/src/model-protocol.ts` 统一导出给主程序和 runtime 使用。

## 4. Internal API

### 4.1 `GET /internal/models/catalog`

返回公共模型目录：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": []
  }
}
```

### 4.2 `POST /internal/model/invoke`

非流式调用（内部批量 events 形态）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "modelId": "mock-general",
    "events": [],
    "attempts": [],
    "attemptsSummary": {}
  }
}
```

### 4.3 `POST /internal/model/invoke/stream`

流式调用（同样以事件数组返回，后续可替换为 SSE/WS 桥接）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "modelId": "mock-general",
    "events": [],
    "attempts": [],
    "attemptsSummary": {}
  }
}
```

## 5. Fallback 策略

- 重试策略：`DefaultRetryPolicy`，最多 2 次重试
- 回退策略：`DefaultFallbackPolicy`
  - `mock-general -> mock-fast`
  - `mock-tools -> mock-general`
- attempts 记录每次尝试是否成功和错误信息，供审计与调试使用

## 6. 内置模型目录

当前内置三种 mock 模型：

- `mock-general`
- `mock-fast`
- `mock-tools`

支持 `list/get/filter`，并提供基础属性：

- `supportsTools`
- `supportsStreaming`
- `supportsJson`
- `latencyTier`
- `priority`

## 7. 后续接入真实 Provider 的方式

保持主链路不变，仅替换 adapter 层：

1. 保持 `ModelInvokeService`、`ModelRouter`、`ModelGateway` 不变
2. 在 `providers` 目录增加真实 provider adapter
3. 将 `MockProviderAdapter` 替换为真实 adapter（支持 secure proxy）
4. 扩展 `fallback-policy` 为成本/延迟感知策略
5. 逐步将 stream 接口升级为 SSE 或内部事件桥接

这样可以在不改 agent 调用方式的前提下完成真实模型切换。

