import { adapter } from './adapter'
import { componentRendererFactory } from './component'
import { pageRendererFactory } from './page'
import { rendererFactory } from './renderer'

export * from './adapter'
export * from './base'
export * from './component'
export * from './context'
export * from './hoc'
export * from './page'
export * from './renderer'
export * from './types'
export * from './utils'

adapter.setRenderers({
  PageRenderer: pageRendererFactory(),
  ComponentRenderer: componentRendererFactory(),
})

export const ReactRenderer = rendererFactory()
