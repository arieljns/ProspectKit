<div align="center">
  <h1>ProspectKit</h1>
  <p>
    A lightweight AI prospecting workspace for founders and small teams.
  </p>
  <p>
    <a href="#why-prospectkit">English</a> ·
    <a href="#中文说明">中文</a>
  </p>
  <p>
    Build account lists, research companies, find contacts, score leads, and draft outreach without adopting a full sales stack.
  </p>

  <p>
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-black.svg" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black.svg" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149eca.svg" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Drizzle-4169e1.svg" />
    <img alt="AI SDK" src="https://img.shields.io/badge/Vercel_AI_SDK-ready-000000.svg" />
  </p>

<img
    alt="ProspectKit cover illustration"
    src="public/marketing/prospectkit-cover.png"
    width="100%"
  />

</div>

## Why ProspectKit

Most early teams do not need a heavyweight AI SDR platform on day one.

Apollo, Clay, CRM automations, enrichment workflows, and outbound sequences are powerful, but they can be too much when a founder or a tiny team only needs to answer a few practical sales questions:

- Which companies should we target?
- What does this company do, and why might they care?
- Who should we talk to?
- Is this lead actually a good fit?
- What should the first message say?

ProspectKit focuses on that core loop. It gives small teams one simple workspace for account research and first-touch outbound, with AI built into the flow instead of hidden behind a complex automation builder.

## Product Flow

```text
Add companies
    ↓
Generate company research
    ↓
Find relevant contacts
    ↓
Score leads against your ICP
    ↓
Draft personalized outreach
    ↓
Track basic pipeline analytics
```

## Features

| Area                      | What it does                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company workspace         | Add target accounts, edit priority, track research status, and manage lists.       |
| AI company research       | Uses Exa search plus an AI model to generate structured company reports.           |
| Contact discovery         | Finds likely decision makers from public web, LinkedIn, and company pages.         |
| Lead management           | Store contacts, update status, set priority, and manage prospect records.          |
| ICP-based scoring         | Scores leads across industry, company need, role fit, seniority, and deal size.    |
| Outreach generation       | Drafts LinkedIn connection requests, cold emails, or InMail-style messages.        |
| Company Prospecting Brief | One page that orchestrates research, contacts, scoring, and recommendations.       |
| Pipeline analytics        | Shows lead volume, A-grade leads, status funnel, score distribution, and trends.   |
| Scoring configuration     | Configure your company, product, target industries, target seniority, and weights. |

## Screens In The App

- `/app/dashboard` - Discover Companies
- `/app/brief/[companyId]` - Company Prospecting Brief
- `/app/contacts` - Manage Leads
- `/app/analytics` - Pipeline Analytics
- `/app/settings/scoring` - ICP and scoring configuration

## Tech Stack

ProspectKit is built with a modern, deployable TypeScript stack:

- **Framework**: Next.js 16 App Router
- **UI**: React 19, Tailwind CSS, shadcn/ui primitives
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **AI orchestration**: Vercel AI SDK
- **Search and enrichment**: Exa Search API

## Quick Start

```bash
git clone <your-fork-or-repo-url>
cd prospect-kit
npm install
```

Create `.env`:

```bash
DATABASE_URL="postgres://..."
DATABASE_MIGRATIONS_URL="postgres://..."
EXA_API_KEY="..."

AI_MODEL_PROVIDER="openai"
AI_MODEL_ID="gpt-5.4-mini"
OPENAI_API_KEY="..."
```

Initialize the database and start the app:

```bash
npm run db:migrate
npm run db:seed # optional demo companies
npm run dev
```

Open the workspace:

```text
http://localhost:3000/app/dashboard
```

## First Run Guide

1. Configure your ICP in `/app/settings/scoring`.
2. Add target companies in `/app/dashboard`.
3. Open a company brief and generate research, contacts, scores, and recommendations.
4. Manage contacts and draft outreach in `/app/contacts`.
5. Review pipeline performance in `/app/analytics`.

## Deploy To Vercel

### 1. Create a production database

Use any hosted PostgreSQL provider. Neon, Supabase, Vercel Postgres, and standard managed Postgres all work.

If your provider gives you separate URLs, use:

- pooled connection for `DATABASE_URL`
- direct connection for `DATABASE_MIGRATIONS_URL`

If it only gives one connection string, use the same value for both.

### 2. Add environment variables in Vercel

Project Settings -> Environment Variables:

```bash
DATABASE_URL="postgres://..."
DATABASE_MIGRATIONS_URL="postgres://..."
EXA_API_KEY="..."
AI_MODEL_PROVIDER="openai"
AI_MODEL_ID="gpt-5.4-mini"
OPENAI_API_KEY="..."
```

### 3. Migrate the production database

Before deploying, run migrations against your production database:

```bash
npm run db:migrate
```

The production build does not automatically create tables. Run migrations explicitly before first use.

### 4. Deploy

Vercel defaults should work:

- Install Command: `npm install`
- Build Command: `npm run build`
- Framework Preset: Next.js

Or deploy with the Vercel CLI:

```bash
npx vercel deploy
```

### 5. Verify the deployment

After deployment:

1. Open `/app/dashboard`.
2. Add a company.
3. Generate a company brief.
4. Confirm contacts appear in `/app/contacts`.
5. Generate a lead score and outreach message.
6. Check `/app/analytics`.

## Commands

```bash
npm run dev          # Run migrations, then start the Next dev server
npm run build        # Build for production
npm start            # Start the production server
npm run lint         # Run ESLint
npm run format       # Format the repository
npm run format:check # Check formatting
```

Database commands:

```bash
npm run db:auto-migrate # Run migrations automatically
npm run db:generate     # Generate migration files from schema changes
npm run db:migrate      # Run migrations manually
npm run db:push         # Push schema changes directly to DB
npm run db:studio       # Open Drizzle Studio
npm run db:check        # Check migration/schema consistency
npm run db:seed         # Seed demo companies
npm run db:seed:force   # Force re-seed demo companies
```

## Project Structure

```text
app/(marketing)/page.tsx                 # Public landing page
app/(workspace)/app/dashboard/page.tsx   # Discover Companies
app/(workspace)/app/contacts/page.tsx    # Manage Leads
app/(workspace)/app/analytics/page.tsx   # Pipeline Analytics
app/(workspace)/app/brief/[companyId]    # Company Prospecting Brief
app/(workspace)/app/settings/scoring     # ICP and scoring configuration

app/api/reports/generate/route.ts        # Generate company reports
app/api/contacts/find/route.ts           # Find contacts
app/api/leads/score/route.ts             # Score leads
app/api/messages/generate/route.ts       # Generate outreach copy
app/api/briefs/generate/route.ts         # Orchestrate report/contact/scoring

lib/db/schema                            # Drizzle schema
lib/server/repositories                  # Database access layer
lib/server/services                      # AI, search, and business services
components/workspace                     # Workspace UI
components/shared/ui                     # Shared UI primitives
```

## Security Notes

ProspectKit is designed to be self-hosted and extended. Before exposing it broadly, review these areas for your deployment:

- Authentication and access control
- Team or tenant separation
- API route protection
- Rate limits for AI and Exa calls
- Data retention and deletion policies

For a private internal deployment, you can start with Vercel Deployment Protection, SSO, or a reverse proxy in front of the app.

## Roadmap Ideas

- Authentication, teams, and roles
- CSV import and export
- Contact deduplication
- CRM sync with HubSpot, Salesforce, or Attio
- Email sending and sequence support
- Better enrichment provenance
- More customizable scoring rubrics
- Hosted demo workspace

## License

ProspectKit is released under the [MIT License](LICENSE).

---

# 中文说明

ProspectKit 是一个面向创始人和小团队的轻量 AI 销售线索工作台。

它可以帮助你建立目标公司列表、研究公司、发现联系人、给线索评分，并生成个性化外联消息，而不需要一开始就引入完整销售系统。

## 为什么做 ProspectKit

大多数早期团队并不需要从第一天就使用很重的 AI SDR 平台。

Apollo、Clay、CRM 自动化、数据 enrichment workflow 和 outbound sequence 都很强大，但当创始人或小团队只是想验证销售方向时，它们往往太复杂了。早期团队真正需要回答的是几个具体问题：

- 哪些公司值得优先触达？
- 这家公司做什么，可能有什么需求？
- 应该联系谁？
- 这个联系人是不是好线索？
- 第一条消息应该怎么写？

ProspectKit 聚焦这条核心链路。它给小团队一个简单的账户研究和首次触达工作台，把 AI 融进产品流程里，而不是藏在复杂的自动化配置器后面。

## 产品流程

```text
添加目标公司
    ↓
生成公司研究
    ↓
发现相关联系人
    ↓
按 ICP 给线索评分
    ↓
生成个性化外联消息
    ↓
查看基础 pipeline 数据
```

## 核心功能

| 模块                      | 功能说明                                                     |
| ------------------------- | ------------------------------------------------------------ |
| 公司工作台                | 添加目标账户、编辑优先级、跟踪研究状态并管理公司列表。       |
| AI 公司研究               | 使用 Exa 搜索和 AI 模型生成结构化公司报告。                  |
| 联系人发现                | 从公开网页、LinkedIn 和公司页面发现可能的决策人。            |
| 线索管理                  | 保存联系人、更新状态、设置优先级并管理 prospect 记录。       |
| ICP 评分                  | 从行业、公司需求、角色匹配、职级和交易规模潜力等维度评分。   |
| 外联消息生成              | 生成 LinkedIn connection request、冷邮件或 InMail 风格消息。 |
| Company Prospecting Brief | 在一个页面中编排公司研究、联系人发现、评分和推荐。           |
| Pipeline Analytics        | 展示线索量、A级线索、状态漏斗、分数分布和趋势。              |
| 评分配置                  | 配置你的公司、产品、目标行业、目标职级和评分权重。           |

## 应用页面

- `/app/dashboard` - Discover Companies，公司发现与列表管理
- `/app/brief/[companyId]` - Company Prospecting Brief，单个公司的销售简报
- `/app/contacts` - Manage Leads，联系人和线索管理
- `/app/analytics` - Pipeline Analytics，销售漏斗和线索数据
- `/app/settings/scoring` - ICP 和评分配置

## 技术栈

ProspectKit 使用一套现代、容易部署的 TypeScript 技术栈：

- **框架**：Next.js 16 App Router
- **UI**：React 19、Tailwind CSS、shadcn/ui primitives
- **数据库**：PostgreSQL
- **ORM**：Drizzle ORM
- **AI 编排**：Vercel AI SDK
- **搜索和 enrichment**：Exa Search API

## 快速开始

```bash
git clone <your-fork-or-repo-url>
cd prospect-kit
npm install
```

创建 `.env`：

```bash
DATABASE_URL="postgres://..."
DATABASE_MIGRATIONS_URL="postgres://..."
EXA_API_KEY="..."

AI_MODEL_PROVIDER="openai"
AI_MODEL_ID="gpt-5.4-mini"
OPENAI_API_KEY="..."
```

初始化数据库并启动：

```bash
npm run db:migrate
npm run db:seed # 可选：插入 demo 公司
npm run dev
```

打开工作台：

```text
http://localhost:3000/app/dashboard
```

`npm run dev` 会先运行待执行的数据库迁移，然后启动 Next.js。

## 第一次使用

1. 在 `/app/settings/scoring` 配置你的公司、产品、目标行业、目标职级和评分权重。
2. 在 `/app/dashboard` 添加目标公司。
3. 打开公司 brief，生成公司研究、联系人、评分和推荐。
4. 在 `/app/contacts` 管理联系人并生成外联消息。
5. 在 `/app/analytics` 查看 pipeline 数据。

## 部署到 Vercel

### 1. 创建生产数据库

准备一个托管 PostgreSQL 数据库。Neon、Supabase、Vercel Postgres 或常规托管 Postgres 都可以。

如果你的数据库服务提供两种连接串，建议：

- `DATABASE_URL` 使用 pooled connection
- `DATABASE_MIGRATIONS_URL` 使用 direct connection

如果只提供一个连接串，两个变量可以填同一个值。

### 2. 在 Vercel 配置环境变量

在 Project Settings -> Environment Variables 中添加：

```bash
DATABASE_URL="postgres://..."
DATABASE_MIGRATIONS_URL="postgres://..."
EXA_API_KEY="..."
AI_MODEL_PROVIDER="openai"
AI_MODEL_ID="gpt-5.4-mini"
OPENAI_API_KEY="..."
```

### 3. 迁移生产数据库

首次部署前，对生产数据库运行：

```bash
npm run db:migrate
```

生产构建不会自动创建数据库表。首次使用前请显式运行迁移。

### 4. 部署

Vercel 默认配置即可：

- Install Command: `npm install`
- Build Command: `npm run build`
- Framework Preset: Next.js

也可以使用 Vercel CLI：

```bash
npx vercel deploy
```

### 5. 部署后验证

部署后建议按顺序检查：

1. 打开 `/app/dashboard`。
2. 添加一个公司。
3. 生成该公司的 brief。
4. 确认联系人出现在 `/app/contacts`。
5. 生成线索评分和外联消息。
6. 检查 `/app/analytics`。

## 常用命令

```bash
npm run dev          # 运行迁移并启动开发服务器
npm run build        # 生产构建
npm start            # 启动生产服务
npm run lint         # 运行 ESLint
npm run format       # 格式化代码
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 插入 demo 公司
```

数据库命令：

```bash
npm run db:auto-migrate # 自动运行迁移
npm run db:generate     # 根据 schema 生成 migration 文件
npm run db:migrate      # 手动运行 migration
npm run db:push         # 直接将 schema 推到数据库
npm run db:studio       # 打开 Drizzle Studio
npm run db:check        # 检查 migration/schema 一致性
npm run db:seed         # 插入 demo 公司
npm run db:seed:force   # 强制重新插入 demo 公司
```

## 项目结构

```text
app/(marketing)/page.tsx                 # 公开 landing page
app/(workspace)/app/dashboard/page.tsx   # Discover Companies
app/(workspace)/app/contacts/page.tsx    # Manage Leads
app/(workspace)/app/analytics/page.tsx   # Pipeline Analytics
app/(workspace)/app/brief/[companyId]    # Company Prospecting Brief
app/(workspace)/app/settings/scoring     # ICP 和评分配置

app/api/reports/generate/route.ts        # 生成公司报告
app/api/contacts/find/route.ts           # 查找联系人
app/api/leads/score/route.ts             # 线索评分
app/api/messages/generate/route.ts       # 生成外联文案
app/api/briefs/generate/route.ts         # 编排 report/contact/scoring

lib/db/schema                            # Drizzle schema
lib/server/repositories                  # 数据库访问层
lib/server/services                      # AI、搜索和业务服务
components/workspace                     # 工作台 UI
components/shared/ui                     # 共享 UI primitives
```

## 安全说明

ProspectKit 适合自部署和二次开发。正式对外开放前，建议检查这些部分：

- 团队或租户隔离
- API route 保护
- AI 和 Exa 调用限流
- 数据保留和删除策略

如果只是内部私有部署，可以先使用 Vercel Deployment Protection、SSO，或在应用前面加反向代理保护。

## Roadmap 想法

- CSV 导入和导出
- 联系人去重
- 与 HubSpot、Salesforce 或 Attio 同步
- 邮件发送和 sequence 支持
- 更好的 enrichment 来源展示
- 更可定制的评分规则
- 托管 demo workspace

## License

ProspectKit 使用 [MIT License](LICENSE) 开源。
