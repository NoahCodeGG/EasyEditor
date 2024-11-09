import type { Component } from '..'

export interface SimulatorRenderer {
  // TODO: 要不要把 components 抽离到 Renderer 中
  // 但是这样插件内不好添加额外组件了
  components: Record<string, Component>
  rerender: () => void

  [key: string]: any
}
