# 项目概述手册

## 1. 项目定位

这是一个基于 `Vue 3 + Vite + TypeScript` 的前端项目，当前更像是一个“绩效管理/绩效考核系统”的业务原型与管理后台，主要覆盖以下场景：

- 日报填写与历史查看
- 绩效指标库管理
- 考核模板配置与发布
- 考核周期管理与统计
- 团队绩效目标设定与评分工作台
- 登录鉴权与租户信息处理

从页面命名、接口目录和交互设计来看，系统面向企业内部绩效管理流程，偏中后台业务应用。

## 2. 技术栈

### 核心框架

- `Vue 3`
- `TypeScript`
- `Vite`
- `Vue Router`
- `Pinia`

### UI 与样式

- `Element Plus`
- `Tailwind CSS 4`
- `lucide-vue-next`
- 项目内同时包含一套 `shadcn/reka-ui` 风格的基础 UI 组件，位于 `src/components/ui`

### 数据与工具

- `axios`
- `web-storage-cache`
- `@vueuse/core`

### 工程化

- `ESLint`
- `Vitest`
- `vue-tsc`

## 3. 启动与构建

`package.json` 中的常用命令：

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test:unit
```

本地开发默认读取 `.env`，当前可见配置包括：

- `VITE_APP_TITLE=绩效系统`
- `VITE_PORT=91`
- `VITE_OPEN=false`

Vite 配置中还支持：

- `@` -> `src` 路径别名
- `VITE_API_TARGET_URL`
- `VITE_API_BASE_URL`

接口基础地址由以下环境变量组合：

```text
baseURL = VITE_API_TARGET_URL + VITE_API_BASE_URL
```

若未配置 `VITE_API_BASE_URL`，代码默认使用 `/api`。

## 4. 目录结构

```text
src/
  api/           接口定义，按业务模块拆分
  assets/        全局样式与静态资源
  components/    业务组件与基础 UI 组件
  hooks/         组合式 hooks
  layouts/       页面布局
  lib/           通用工具方法
  router/        路由配置与守卫
  store/         Pinia 状态管理
  utils/         请求、鉴权、字典等通用能力
  views/         页面级视图
  __tests__/     单元测试
```

较重要的子目录：

- `src/views`
  - `daily-report`：日报相关页面
  - `template`：考核模板搭建页
  - `assessment`：考核周期、绩效大厅、统计看板
- `src/components/assessment`：团队绩效、目标设定、评分工作台
- `src/api/system`：系统级接口，如部门、字典等

## 5. 核心页面与业务模块

根据当前路由，系统主入口页面包括：

- `/login`
  - 登录页，支持扫码登录和账号密码登录
- `/daily-report`
  - 我的工作日报列表页
- `/daily-report/create`
  - 日报填写页
- `/configuration`
  - 绩效配置中心，包含指标库与考核模板管理
- `/template/builder`
  - 模板搭建页，支持创建、编辑、查看、发布
- `/assessment/cycle`
  - 考核周期管理
- `/assessment/hall`
  - 绩效工作台/绩效大厅
- `/assessment/cycle/:id/stats`
  - 周期统计看板

### 业务理解

从代码结构看，当前系统大致流程是：

1. 用户登录进入系统
2. 在“绩效配置中心”维护指标库和考核模板
3. 在模板搭建页配置适用部门、适用人员、考核指标和权重
4. 发布模板后进入考核执行阶段
5. 员工通过日报或工作台填报/查看绩效数据
6. 管理者在团队工作台进行目标设定、评分和结果查看

## 6. 路由与登录控制

路由入口位于 `src/router/index.ts`。

当前特征：

- 使用 `createWebHistory`
- 默认布局为 `src/layouts/default.vue`
- 未登录仅允许访问 `/login`
- 进入受保护页面前会检查 token
- 若已登录，会在路由守卫中预加载全局字典数据

未登录访问业务页时，会被重定向到：

```text
/login?redirect=原始路径
```

## 7. 状态管理与缓存

状态管理使用 `Pinia`，并接入了 `pinia-plugin-persistedstate`。

当前可见的全局状态职责主要包括：

- 用户信息
- 数据字典

本地缓存通过 `web-storage-cache` 封装，主要存储：

- `ACCESS_TOKEN`
- `REFRESH_TOKEN`
- `TenantId`
- 登录表单信息

## 8. 请求与鉴权机制

请求封装位于 `src/utils/request.ts`，主要能力包括：

- 基于 `axios` 创建统一请求实例
- 自动注入 `Authorization: Bearer <token>`
- 自动附带 `tenant-id`
- 可选附带环境 `tag`
- 统一处理错误提示
- `401` 时自动刷新 token
- 刷新 token 期间，将后续请求挂起并重放

这说明项目已经具备较完整的中后台登录态处理能力，而不只是静态原型页面。

## 9. 当前项目特点

### 优点

- 目录划分清晰，按业务模块组织
- 路由、鉴权、缓存、字典、接口分层比较完整
- 页面原型和业务意图较清楚，适合继续演进
- 已具备基础测试、Lint、构建能力

### 现状判断

- 项目中部分页面仍含有较多演示/原型性质数据
- 存在中文注释和字符串编码异常现象，疑似文件编码不统一
- 仓库当前已有未提交修改，不建议在不了解背景时直接覆盖

## 10. 建议的阅读顺序

如果要快速接手这个项目，建议按下面顺序阅读：

1. `package.json`
2. `src/main.ts`
3. `src/router/index.ts`
4. `src/utils/request.ts`
5. `src/views/Login.vue`
6. `src/views/PerformanceConfig.vue`
7. `src/views/template/Builder.vue`
8. `src/views/assessment/PerformanceHall.vue`

## 11. 一句话总结

这是一个企业绩效管理前端项目，技术栈现代、结构完整，已经具备登录鉴权、模板配置、日报填报和绩效执行工作台等核心模块，当前阶段介于“可交互业务原型”与“持续开发中的业务系统”之间。
