# xAI Live Search Citations 实现指南

本文档记录如何在 Vercel AI SDK 中正确实现 xAI Grok 的 Live Search Citations 功能。

## 快速开始

如果你只想快速实现，跳到 [最终解决方案](#✅-最终解决方案) 部分。

## 目录

1. [问题背景](#问题背景)
2. [尝试过的方案（失败）](#尝试过的方案失败)
3. [最终解决方案](#✅-最终解决方案)
4. [关键要点](#关键要点)
5. [Live Search 配置](#live-search-配置)
6. [常见问题](#常见问题)
7. [依赖组件](#依赖组件)

## 问题背景

xAI 的 Grok 模型支持 Live Search 功能，可以实时搜索网页、新闻和 X/Twitter 内容。虽然 Live Search 功能本身容易启用，但如何将搜索来源（citations）正确显示在 UI 中却遇到了一些挑战。

## 尝试过的方案（失败）

### ❌ 方案 1: 直接使用 `toUIMessageStreamResponse()`

```typescript
const result = streamText({ ... });
return result.toUIMessageStreamResponse();
```

**问题**：sources 不会包含在流式响应中，无法传递到客户端。

### ❌ 方案 2: 使用 `toDataStreamResponse()`

```typescript
return result.toDataStreamResponse();
```

**问题**：该方法在 AI SDK 5.x 中不存在。

### ❌ 方案 3: 使用 `createDataStreamResponse()`

```typescript
return createDataStreamResponse({ ... });
```

**问题**：该方法在 AI SDK 5.x 中也不存在。

### ❌ 方案 4: 直接写入 `type: 'source'`

```typescript
writer.write({
  type: "source",
  value: source,
});
```

**问题**：AI SDK 的类型验证拒绝了这个格式，期望的是 `source-url` 类型。

## ✅ 最终解决方案

使用 AI SDK 5.x 的 **`createUIMessageStream`** + **正确的 `source-url` 格式**。

### 服务器端实现

```typescript
// app/api/chat/route.ts
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { xai } from "@ai-sdk/xai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: xai("grok-4-fast-non-reasoning-latest"),
        system: `Your system prompt...`,
        messages: convertToModelMessages(messages),
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "auto", // 自动判断何时搜索
              returnCitations: true, // 必须启用
              maxSearchResults: 10,
              sources: [
                { type: "web", safeSearch: true },
                { type: "news", safeSearch: true },
                { type: "x" },
              ],
            },
          },
        },
        tools: {
          /* your tools */
        },
        onFinish: async () => {
          // 关键：在 onFinish 中获取并写入 sources
          try {
            const sources = await result.sources;

            if (sources && sources.length > 0) {
              sources.forEach((source: any) => {
                if (source.sourceType === "url") {
                  // 使用正确的 source-url 格式
                  writer.write({
                    type: "source-url",
                    sourceId: source.id,
                    url: source.url,
                    title: source.title || new URL(source.url).hostname,
                  });
                }
              });
            }
          } catch (err) {
            console.log("No sources available:", err);
          }
        },
      });

      // 合并文本流
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### 客户端实现

#### 方案 A: 使用 Prompt Kit Source 组件（推荐）

使用来自 [Prompt Kit](https://www.prompt-kit.com/docs/source) 的 `Source` 组件提供更美观的 HoverCard 预览。

**安装 Source 组件**：

```bash
npx shadcn add "https://prompt-kit.com/c/source.json"
```

这会安装 `@/components/shadcnui/source` 组件（以及依赖的 `hover-card` 组件）。

**使用示例**：

```typescript
// components/primitives/tool-calling.tsx
import {
  Source,
  SourceContent,
  SourceTrigger,
} from "@/components/shadcnui/source"

// 1. 创建 Citations 组件
const Citations = memo(({ sources }: { sources?: any[] }) => {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((source: any, index: number) => {
        if (source.sourceType === 'url' && source.url) {
          return (
            <Source key={source.id || index} href={source.url}>
              <SourceTrigger label={index + 1} showFavicon />
              <SourceContent
                title={source.title || new URL(source.url).hostname.replace('www.', '')}
                description=""
              />
            </Source>
          )
        }
        return null
      })}
    </div>
  )
})

Citations.displayName = "Citations"
```

**特点**：

- ✨ 带编号的小徽章显示
- 🌐 自动显示网站 favicon
- 📋 悬停显示 HoverCard 预览
- 🎯 横向紧凑布局

#### 方案 B: 简单列表样式

如果不使用 Source 组件，也可以用简单的列表。

### 在消息组件中渲染 Citations

无论使用哪种 Citations 实现，都需要在消息组件中提取 sources 并渲染：

```typescript
export const MessageComponent = memo(({ message, isLastMessage }) => {
  // ... 其他代码

  return (
    <Message>
      {isAssistant ? (
        <div className="group flex w-full flex-col gap-0 space-y-2">
          {/* 工具调用 */}
          <div className="w-full">
            {message?.parts
              .filter((part: any) => part.type?.startsWith("tool-"))
              .map((part: any, index: number) => renderToolPart(part, index))}
          </div>

          {/* 文本内容 */}
          <MessageContent markdown>
            {message?.parts
              .filter((part: any) => part.type === "text")
              .map((part: any) => part.text)
              .join("")}
          </MessageContent>

          {/* Citations - 从 message.parts 中提取 */}
          {(() => {
            const sources = message?.parts
              .filter((part: any) => part.type === 'source-url')
              .map((part: any) => ({
                type: 'source',
                sourceType: 'url',
                id: part.sourceId,
                url: part.url,
                title: part.title,
              }))

            return <Citations sources={sources} />
          })()}

          {/* 消息操作按钮 */}
          <MessageActions>
            {/* ... */}
          </MessageActions>
        </div>
      ) : (
        {/* 用户消息 */}
      )}
    </Message>
  )
})
```

## 关键要点

### 1. 使用 `createUIMessageStream` 和 `createUIMessageStreamResponse`

这是 AI SDK 5.x 中正确的流式自定义数据的方式：

- `createUIMessageStream` - 创建一个可以写入自定义数据的流
- `writer.write()` - 写入数据部分
- `writer.merge()` - 合并 LLM 的文本流
- `createUIMessageStreamResponse` - 返回流式响应

### 2. 在 `onFinish` 回调中获取 sources

```typescript
onFinish: async () => {
  const sources = await result.sources;
  // 处理 sources
};
```

**为什么？** 因为 sources 只有在 LLM 完成响应后才可用。

### 3. 使用正确的 `source-url` 格式

AI SDK 期望的格式：

```typescript
{
  type: 'source-url',     // 必须是 'source-url'，不是 'source'
  sourceId: string,       // 必需
  url: string,            // 必需
  title?: string,         // 可选，但建议提供
}
```

### 4. 客户端从 `message.parts` 中提取

```typescript
const sources = message?.parts
  .filter((part: any) => part.type === "source-url")
  .map((part: any) => ({
    // 转换为你的 Citations 组件需要的格式
  }));
```

## Live Search 配置

```typescript
providerOptions: {
  xai: {
    searchParameters: {
      mode: 'auto',              // 'auto' | 'on' | 'off'
      returnCitations: true,     // 必须为 true 才能获取 sources
      maxSearchResults: 10,      // 最多返回的结果数
      sources: [
        {
          type: 'web',
          safeSearch: true,
          // 可选：country, allowedWebsites, excludedWebsites
        },
        {
          type: 'news',
          safeSearch: true,
          // 可选：country, excludedWebsites
        },
        {
          type: 'x',
          // 可选：includedXHandles, excludedXHandles, postViewCount
        },
      ],
    },
  },
}
```

## 常见问题

### Q: Sources 没有显示怎么办？

**A**: 检查以下几点：

1. `returnCitations: true` 是否设置
2. 问题是否真的触发了搜索（试试明确要求最新信息的问题）
3. 服务器日志中是否显示 "Sources from xAI"
4. 客户端是否正确过滤了 `source-url` 类型

### Q: 如何强制使用 Live Search？

**A**: 将 `mode` 设置为 `'on'` 而不是 `'auto'`。

### Q: 可以自定义搜索范围吗？

**A**: 可以，例如：

```typescript
sources: [
  {
    type: "web",
    country: "US",
    allowedWebsites: ["techcrunch.com", "theverge.com"],
  },
];
```

### Q: 为什么用 `writer.write()` 而不是 `dataStream.writeData()`？

**A**: `createUIMessageStream` 返回的 `writer` 对象有正确的类型验证，确保数据格式符合 AI SDK 的要求。

### Q: 如何调试 sources 是否被正确接收？

**A**:

1. **服务器端**：查看终端日志，应该显示 "Sources from xAI: [...]"
2. **客户端**：在浏览器控制台查看 message.parts，应该包含 `type: 'source-url'` 的部分
3. 使用 `console.log` 在 Citations 组件中打印 sources 数组

## 支持的 Source 类型

根据 AI SDK 文档，支持两种 source 类型：

1. **`source-url`** - URL 来源

   ```typescript
   {
     type: 'source-url',
     sourceId: string,
     url: string,
     title?: string,
   }
   ```

2. **`source-document`** - 文档来源
   ```typescript
   {
     type: 'source-document',
     sourceId: string,
     mediaType: string,
     title: string,
     content?: string,
   }
   ```

## 依赖组件

### Prompt Kit Source Component

Source 组件来自 [Prompt Kit](https://www.prompt-kit.com/)，一个高质量的 AI 应用 UI 组件库。

**安装命令**：

```bash
npx shadcn add "https://prompt-kit.com/c/source.json"
```

这会安装：

- `@/components/shadcnui/source.tsx` - Source 组件
- `@/components/shadcnui/hover-card.tsx` - HoverCard 依赖（如果未安装）

**组件特性**：

- 🎨 美观的徽章式来源显示
- 🌐 自动获取和显示网站 favicon（使用 Google Favicon API）
- 📋 悬停显示详细的 HoverCard 预览
- 🔗 完全可访问和键盘导航友好
- 📱 响应式横向布局，自动换行

**官方文档**：

- [Prompt Kit - Source Component Docs](https://www.prompt-kit.com/docs/source)

## 技术栈版本

- `ai`: 5.0.76
- `@ai-sdk/xai`: 2.0.26
- Next.js: 14.2.4
- Prompt Kit Source Component: 通过 shadcn CLI 安装

## 相关文档

- [AI SDK - Streaming Custom Data](https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-custom-data)
- [xAI Provider - Live Search](https://sdk.vercel.ai/docs/ai-sdk-providers/xai#live-search)
- [UI Message Stream Protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol)
- [Prompt Kit - Source Component](https://www.prompt-kit.com/docs/source)
