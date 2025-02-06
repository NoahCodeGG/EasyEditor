<div align="center">

<!-- <img src=".github/assets/logo.svg" width="70" alt="logo" />

### EastEditor -->

<img src=".github/assets/banner.svg" height="60" alt="logo" />

<br />

<b>🎉 面向扩展的跨框架低代码引擎 🎉</b>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

EasyEditor 是一款面向企业级应用的低代码引擎，通过插件化架构和跨框架渲染能力，支持快速构建可视化搭建系统。

## ✨ 核心特性

- **解耦设计**：引擎核心与框架无关，支持多种框架渲染扩展
- **可视化设计**：完整的设计器实现，拖拽布局、吸附对齐、多设备预览、撤销/重做栈...
- **插件化架构**：灵活的插件系统设计，生命周期管理、热键绑定、类扩展机制、依赖注入...
- **渲染引擎**：多框架支持、实时预览、Schema 驱动、组件隔离沙箱
- **企业级能力**：数据源管理、多语言支持、版本控制、在线协作

## 🛠️ 快速开始

### Dashboard + React

1. 安装

```bash
pnpm install @easyeditor/core @easyeditor/plugin-dashboard @easyeditor/react-renderer-dashboard
```

2. 初始化

```ts
import { createEditor } from '@easyeditor/core'
import DashboardPlugin from '@easyeditor/plugin-dashboard'


export const editor = createEasyEditor({
  plugins: [DashboardPlugin()],
  setters,
  components,
  componentMetas,
})

// 获取核心模块
export const designer = await editor.onceGot<Designer>('designer')
export const project = await editor.onceGot<Project>('project')
export const simulator = await editor.onceGot<Simulator>('simulator')
```

3. 使用

```tsx
// 设计态
import { SimulatorRenderer } from '@easyeditor/react-renderer-dashboard'
<SimulatorRenderer host={simulator} />

// 预览态
import { ReactRenderer } from '@easyeditor/react-renderer-dashboard'
<ReactRenderer components={simulator.components} schema={docSchema} />
```

## 🔌 插件开发

```ts
import type { Plugin } from '@easy-editor/core'

const ExamplePlugin: Plugin = ctx => {
  return {
    name: 'ExamplePlugin',
    deps: [],
    init(ctx) {
      const { hotkey } = ctx

      ctx.logger.log('打个日志', ctx)

      // add hotkey
      hotkey.bind('ctrl+d', e => {
        e.preventDefault()
        logger.log('ctrl+d')
      })
    },
    // 扩展类
    extend({ extendClass, extend }) {
      extend('Designer', {
        test: {
          value(this: Designer) {
            console.log('test', this)
          },
        },
      })
    }
  }
}

// 使用
createEasyEditor({
  plugins: [ExamplePlugin()],
  // ...
})
```

## 🌍 进度

| 模块 | 状态 | 描述 |
| --- | --- | --- |
| 组件版本管理 | 🚧 开发 | 基于 Git 的组件版本控制 |
| 多语言国际化 | 🚧 开发 | 支持动态语言包加载 |
| 权限管理系统 | ⏳ 规划 | RBAC 权限模型与操作审计 |
| 数据源管理 | ⏳ 规划 | 支持多种数据源管理 |
| 在线协作编辑 | ⏳ 规划 | 支持多人协作编辑 |


## 🤝 贡献指南

完整指南请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

本项目采用 MIT 许可证，您可以自由使用、修改和分发代码。商业使用时需保留版权声明。

