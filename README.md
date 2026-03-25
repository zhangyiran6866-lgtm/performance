# performance

企业绩效管理前端项目，基于 Vue 3、Vite 和 TypeScript 构建，覆盖登录鉴权、日报管理、绩效模板配置、考核周期管理和绩效工作台等核心场景。

## 项目简介

当前仓库更接近一个可持续迭代的业务系统前端，已经具备较完整的页面结构、路由组织、接口封装和登录态处理能力，适合作为绩效管理系统的业务底座继续开发。

主要功能方向包括：

- 登录与用户鉴权
- 日报填写与列表查看
- 绩效指标库与模板管理
- 考核周期与统计看板
- 团队目标设定与评分工作台

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Vitest
- ESLint

## 环境要求

- Node.js 18 及以上
- npm 9 及以上

## 快速开始

```bash
npm install
npm run dev
```

默认开发命令会启动 Vite 本地服务。

## 常用命令

```bash
npm run dev
npm run build
npm run build:test
npm run build:prod
npm run preview
npm run lint
npm run test:unit
```

## 环境变量

项目使用 `.env`、`.env.local`、`.env.test`、`.env.production` 管理不同环境配置。

常见配置项包括：

- `VITE_APP_TITLE`
- `VITE_PORT`
- `VITE_OPEN`
- `VITE_PUBLIC_PATH`
- `VITE_API_TARGET_URL`
- `VITE_API_BASE_URL`
- `VITE_OUT_DIR`

## 目录结构

```text
src/
  api/         接口定义
  assets/      静态资源
  components/  业务组件与基础组件
  hooks/       组合式逻辑
  layouts/     页面布局
  lib/         通用方法
  router/      路由配置
  store/       状态管理
  styles/      全局样式
  utils/       请求与工具封装
  views/       页面视图
  __tests__/   单元测试
```

## 业务模块

当前可见的核心业务模块主要集中在以下几个方向：

- `src/views/Login.vue`：登录入口
- `src/views/daily-report`：日报相关页面
- `src/views/template`：绩效模板搭建与配置
- `src/views/assessment`：考核周期、绩效大厅和统计看板
- `src/components/assessment`：团队评分与目标工作台

## 工程说明

- 路径别名 `@` 默认指向 `src`
- 项目使用 `createWebHistory` 组织前端路由
- 请求层基于 Axios 封装，统一处理 token 与错误提示
- 状态管理基于 Pinia，并接入持久化插件

## 仓库建议

当前仓库中包含构建产物压缩包和部分环境文件。如果后续准备长期对外协作，建议再补充：

- 更明确的接口联调说明
- 环境变量示例文件
- 构建产物是否纳入版本管理的约定
- 部署方式与发布流程说明
