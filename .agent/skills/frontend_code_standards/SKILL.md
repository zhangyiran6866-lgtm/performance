---
name: Frontend Code Standards
description: 现代前端通用代码规范指南，结合了 ESLint 和 Vue 的最佳实践。
---

# 前端代码规范 (Frontend Code Standards)

本项目遵循一套严格但现代化的前端通用规范。作为 AI 助手，在本项目中协助编写及修改代码时，请严格遵守以下规则：

## 1. 基础代码格式

- **缩进**: 使用 2 个空格进行缩进，禁止使用 Tab。
- **引号**: JavaScript/TypeScript 默认使用单引号 `'`，而在 HTML/Vue 模板属性中默认使用双引号 `"`。
- **分号**: 推荐在语句末尾使用分号 `;`。
- **逗号**: 对于多行对象和数组，要求使用尾随逗号 (Trailing comma)。
- **行宽**: 单行代码尽量不超过 100 个字符。

## 2. 命名规范

- **变量和函数**: 使用 `camelCase` 小驼峰命名法（例如：`getUserInfo`）。
- **类和组件**: 使用 `PascalCase` 大驼峰命名法（例如：`UserProfile` 或 `UserProfile.vue`）。
- **常量**: 使用大写字母及下划线分隔，即 `UPPER_SNAKE_CASE`（例如：`MAX_REQUEST_TIMEOUT`）。
- **CSS 类名**: 推荐使用连字符命名（例如：`btn-primary`），或者遵循 TailwindCSS 等所用框架的风格。

## 3. Vue 3 特有规范

- 遵循 [Vue 官方风格指南 (Style Guide)](https://vuejs.org/style-guide/)。
- 组件名应该始终是由多个单词组成的，防止和已有及未来的 HTML 元素冲突（例如，请使用 `TodoItem.vue` 而不是 `Todo.vue`）。
- 优先使用 `<script setup>` 语法进行组合式 API (Composition API) 的开发。
- 模板中的指令优先使用缩写（`:` 替代 `v-bind:`，`@` 替代 `v-on:`，`#` 替代 `v-slot:`）。

## 4. 环境变量（.env）编写规范

- **单变量单注释**: env 文件中定义的每一个环境变量上方，都必须写有明确的中文注释，说明该变量的用途。
- **隔行空行**: 不同变量（连带其头部注释）之间应当**至少保留一个空行**，提升配置文件的可读性。

## 4. 自动格式化 Hook 处理流 (AI Workflow Hook)

为了确保每次向项目中写入的代码遵循此规范，我们在 AI 工作流层面增加一个 **“自动格式化钩子 (Formatting Hook)”** 约定：

> **触发条件**：AI 助手在对当前项目进行了**重要的业务逻辑或多文件修改**之后（例如完成了某个需求开发）。
> **执行动作**：
>
> 1. AI 必须向用户询问：“本次代码已更新，是否需要帮您执行自动化的代码规范检查与格式化操作 (ESLint / Prettier)？”
> 2. 当用户确认后，AI 需要主动调用终端命令执行格式化，通常为 `npm run lint -- --fix` 或相应的代码整理命令。
> 3. AI 需要总结最终由于规范调整而产生的任何关键修复事项。
