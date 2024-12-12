import type { JSONObject, NodeSchema, RootSchema } from '@easy-editor/core'

export type Schema = NodeSchema | RootSchema

export interface RendererAppHelper {
  /** 全局公共函数 */
  utils?: Record<string, any>

  /** 全局常量 */
  constants?: Record<string, any>

  /** @experimental 内部使用 */
  requestHandlersMap: Record<string, any>
}

export interface NodeInfo {
  schema?: NodeSchema
  Comp: any
  componentInfo?: any
  componentChildren?: any
}

export interface JSExpression {
  type: string
  value: string
}

export interface DataSourceItem {
  id: string
  isInit?: boolean | JSExpression
  type?: string
  options?: {
    uri: string | JSExpression
    params?: JSONObject | JSExpression
    method?: string | JSExpression
    shouldFetch?: string
    willFetch?: string
    fit?: string
    didFetch?: string
  }
  dataHandler?: JSExpression
}

export interface DataSource {
  list?: DataSourceItem[]
  dataHandler?: JSExpression
}
