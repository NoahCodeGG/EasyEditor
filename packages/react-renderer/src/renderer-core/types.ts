import type { DesignMode, JSONObject, NodeSchema, RootSchema, Simulator, SimulatorRenderer } from '@easy-editor/core'
import type { Component } from 'react'
import type { RendererProps, RendererState } from '..'

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

export interface BaseRendererProps {
  __appHelper?: RendererAppHelper
  __components: Record<string, React.ComponentType>
  __ctx?: Record<string, any>
  __schema: RootSchema
  __designMode?: DesignMode
  __host?: Simulator
  __container?: SimulatorRenderer
  config?: Record<string, any>
  designMode?: DesignMode
  className?: string
  style?: React.CSSProperties
  id?: string | number
  getSchemaChangedSymbol?: () => boolean
  setSchemaChangedSymbol?: (symbol: boolean) => void
  thisRequiredInJSE?: boolean
  documentId?: string
  getNode?: any

  /**
   * 设备类型，默认值：'default'
   */
  device?: 'default' | 'pc' | 'mobile' | string
  componentName?: string
}

export interface BaseRendererContext {
  appHelper: RendererAppHelper
  components: Record<string, React.ComponentType>
  engine: Record<string, any>
  pageContext?: BaseRenderComponent
  compContext?: BaseRenderComponent
}

export type BaseRendererInstance = Component<BaseRendererProps, Record<string, any>, any> & {
  reloadDataSource(): Promise<any>
  __beforeInit(props: BaseRendererProps): void
  __init(props: BaseRendererProps): void
  __afterInit(props: BaseRendererProps): void
  __executeLifeCycleMethod(method: string, args?: any[]): void
  __getComponentView(): React.ComponentType | undefined
  __bindCustomMethods(props: BaseRendererProps): void
  __generateCtx(ctx: Record<string, any>): void
  __parseData(data: any, ctx?: any): any
  __initDataSource(props: BaseRendererProps): void
  __writeCss(props: BaseRendererProps): void
  __render(): void
  __getRef(ref: any): void
  __getSchemaChildrenVirtualDom(schema: NodeSchema | undefined, Comp: any, nodeChildrenMap?: any): any
  __getComponentProps(schema: NodeSchema | undefined, scope: any, Comp: any, componentInfo?: any): any
  __createDom(): any
  __createVirtualDom(schema: any, self: any, parentInfo: NodeInfo, idx: string | number): any
  __createLoopVirtualDom(schema: any, self: any, parentInfo: NodeInfo, idx: number | string): any
  __parseProps(props: any, self: any, path: string, info: NodeInfo): any
  __renderContextProvider(customProps?: object, children?: any): any
  __renderContextConsumer(children: any): any
  __renderContent(children: any): any
  __checkSchema(schema: NodeSchema | undefined, extraComponents?: string | string[]): any
  __renderComp(Comp: any, ctxProps: object): any
  $(id: string, instance?: any): any
}

export interface BaseRenderComponent {
  new (props: BaseRendererProps): BaseRendererInstance
}

export interface RenderComponent {
  displayName: string
  defaultProps: RendererProps

  new (
    props: RendererProps,
    context: any,
  ): Component<RendererProps, RendererState> & {
    [x: string]: any
    __getRef: (ref: any) => void
    componentDidMount(): Promise<void> | void
    componentDidUpdate(): Promise<void> | void
    componentWillUnmount(): Promise<void> | void
    componentDidCatch(e: any): Promise<void> | void
    shouldComponentUpdate(nextProps: RendererProps): boolean
    isValidComponent(SetComponent: any): any
    createElement(SetComponent: any, props: any, children?: any): any
    getNotFoundComponent(): any
    getFaultComponent(): any
  }
}
