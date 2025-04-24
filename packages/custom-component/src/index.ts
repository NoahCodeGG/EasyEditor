// packages/custom-component/src/index.ts
import Component from './component'
import meta from './meta'

// 默认导出符合插件规范的对象
export default {
  component: Component,
  metadata: meta,
}
