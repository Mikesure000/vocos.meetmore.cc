# VocosAI 版本记录

## v3.5.0 — 工作台增强 (2026-06-07)

### WorkspacePage 升级
- **8 卡片布局**：新增生产卡、复盘数卡片
- **品类分布**：三大品类项目数，可点击跳转知识库
- **最近任务**：显示品类标签 + 项目名
- **backend**：workspace stats 新增 productionCards/reviews/categoryStats

---

## v3.4.0 — Mock 清理 (2026-06-07)

comment-cleaning DB 真实统计 / reply-chains DB 查询 / AdFitPage+CommentOpsPage API驱动

---

## v3.3.0 — 内容生产卡 Mock→API 升级 (2026-06-07)

### 生产卡页面全面升级
- **DouyinCardPage / XiaohongshuCardPage 重写**：从硬编码 `const c = mockCard` 改为 API 驱动
  - 优先从 `GET /api/production-cards?platform=` 读取 DB
  - 无数据时展示结构化 fallback
  - 新增「AI 重新生成」按钮 → `POST /api/production-cards/generate`
  - 标题旁显示 🟢"AI 生成" / 🟡"示例数据" Chip
- **analysis.service.ts**：新增 agent-11 → ProductionCard 表持久化
- **orchestrator.ts**：Pipeline 完成后自动写入生产卡到 DB

### 全洞察页面 Mock→API 状态

| 页面 | 数据来源 | 状态 |
|------|---------|------|
| ContentBreakdownPage | DB / Mock 降级 | ✅ |
| AttributionPage | DB / Mock 降级 | ✅ |
| DemandMapPage | DB / Mock 降级 | ✅ |
| BarrierMapPage | DB / Mock 降级 | ✅ |
| StrategyCardPage | DB 原生 | ✅ |
| DouyinCardPage | DB / API 生成 | ✅ |
| XiaohongshuCardPage | DB / API 生成 | ✅ |
| HighValuePage | DB 原生 | ✅ |
| CommentInsightPage | DB 原生 | ✅ |

---

## v3.2.0 — AI Pipeline ↔ DB 数据桥 (2026-06-07)

### Mock → DB 数据链路打通
**问题**：AI Pipeline（17 Agent）在运行，但洞察页面全读硬编码 Mock。

**方案**：
- **analysis.service.ts**：新建服务层，`getOrMock` 模式（DB 优先 → Mock 降级）
- **analysis.routes.ts**：6 个 insight 端点改用 service，返回 `_source: "db"|"mock"`
- **orchestrator.ts**：Pipeline 完成后 `savePipelineResults()` 写入 DB 表
- **前端**：4 页面头部显示 "示例数据" / "AI 分析" Chip，Mock 时顶部 Alert 提示

---

## v3.1.0 — 动态导航 (2026-06-07)

6 组任务上下文感知导航，进入任务页面自动展开分析链路+策略生产+质检复盘。

---

## v3.0.0 — 蓝图重构：品类系统+复盘闭环 (2026-06-06)

### 产品定位升级
从"宽泛的 AI Agent 平台"转型为**三大品类（美妆护肤/母婴健康/功效食品）AI 内容策略生产系统**，
以"内容-评论归因→内容生产卡"为唯一核心价值链。

### 新增模块
- **品类系统**：Category 数据模型 + 项目/任务全链路品类绑定 + 三大品类知识库（合规规则+平台方法论）
- **发布后复盘**：PostPublishReview 数据模型 + 复盘页面 + 完整 CRUD API
- **品类知识库页面**：CategoryListPage + CategoryKnowledgePage，展示品类特征/合规边界/平台方法论
- **品类选择器**：ProjectListPage 创建对话框三选一品类卡片（💄👶🍵）

### 导航重构
```
工作空间 → 工作台 / 项目管理 / 发布后复盘
品类与品牌 → 品类知识库 / 品牌管理
设置 → 个人设置 / 团队设置
```
原主导航从 2 分组 3 项扩展为 3 分组 7 项。

### 数据库变更
- `categories` 表：id/name/slug/knowledgeBase/complianceRules/platformMethodology
- `projects.categoryId`：关联品类
- `post_publish_reviews` 表：taskId/newContentUrl/metrics/strategyExecutionScore/nextRoundSuggestions

### 后端新增 API
| 路由 | 端点 |
|------|------|
| Category | GET /api/categories, GET /api/categories/:id, GET /api/categories/slug/:slug |
| Review | POST /api/reviews, GET /api/reviews, GET /api/reviews/task/:taskId, GET /api/reviews/:id, PUT /api/reviews/:id |

### 前端页面改造
- `ProjectListPage`：创建对话框增加品类选择
- `ProjectDetailPage`：显示品类 Chip（可点击跳转品类知识库）
- `TaskCreatePage`：展示项目品类上下文 Alert
- `AppLayout`：新增品类知识库/发布后复盘导航入口

---

## v2.0.0 — 部署到 meetmore.cc (2026-06-06)

### 部署架构
```
前端: GitHub Pages → vocos.meetmore.cc (静态站点)
后端: Render.com → api.meetmore.cc (Docker容器)
数据库: Render.com 持久磁盘 SQLite
CI/CD: GitHub Actions 自动部署
```

### 部署配置
- ✅ `frontend/index.html` — API地址注入（开发/生产自动切换）
- ✅ `frontend/vite.config.ts` — 生产构建优化（vendor/mui/charts/motion代码分割）
- ✅ `backend/Dockerfile` — Docker容器化 + 启动自动建表+Seed
- ✅ `backend/render.yaml` — Render.com 服务配置
- ✅ `.github/workflows/deploy.yml` — GitHub Actions CI/CD
  - 自动注入 `window.VOCOS_API_BASE = https://api.meetmore.cc`
  - 自动生成 `CNAME` → `vocos.meetmore.cc`
  - GitHub Pages 部署

### 构建验证
```
✅ 前端生产构建成功：48个文件
   vendor: 163KB | mui: 374KB | charts: 410KB | motion: 125KB
   每个页面: 1-7KB 懒加载
✅ 代码分割: vendor/mui/charts/motion 独立chunk
✅ 全局错误处理 + 优雅关闭 + 进程守护
```

### 部署步骤
1. `git push origin main` → GitHub Actions 自动构建
2. 前端部署到 `vocos.meetmore.cc`（GitHub Pages）
3. 后端部署到 `api.meetmore.cc`（Render.com Docker）
4. DNS 已配置：vocos.meetmore.cc CNAME → Mikesure000.github.io

---

## v1.9.0 — 稳定性 (2026-06-06)
## v1.8.0 — 用户体验修复 (2026-06-06)
## v1.7.0 — Skill学习引擎 (2026-06-06)
## v1.6.0 — Agent+Skill架构 (2026-06-06)
## v1.5.0 ~ v0.1.0 (2026-06-05~06)
