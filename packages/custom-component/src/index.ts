import { Component } from './component'
import { metadata } from './metadata'
import { propDefinitions } from './props'

// 单独导出组件部分
export { Component, metadata, propDefinitions }

// 导出组件定义（默认导出）
export default {
  component: Component,
  metadata,
  props: propDefinitions,
}
