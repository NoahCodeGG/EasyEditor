import { type DesignMode, type NodeSchema, type RootSchema, logger } from '@easy-editor/core'
import { isEmpty } from 'lodash-es'
import { Component, createElement } from 'react'
import FaultComponent, { type FaultComponentProps } from './components/FaultComponent'
import NotFoundComponent, { type NotFoundComponentProps } from './components/NotFoundComponent'
import { RendererContext } from './context'
import type { RendererAppHelper } from './types'
import { isSchema } from './utils'

export interface RendererProps {
  /** 符合低代码搭建协议的数据 */
  schema: RootSchema | NodeSchema

  /** 组件依赖的实例 */
  components: Record<string, React.ElementType>

  /** CSS 类名 */
  className?: string

  /** style */
  style?: React.CSSProperties

  /** id */
  id?: string | number

  /** 主要用于设置渲染模块的全局上下文，里面定义的内容可以在低代码中通过 this 来访问，比如 this.utils */
  appHelper?: RendererAppHelper

  /**
   * 配置规范参见《低代码搭建组件描述协议》https://lowcode-engine.cn/lowcode
   * 主要在搭建场景中使用，用于提升用户搭建体验。
   *
   * > 在生产环境下不需要设置
   */
  componentsMap?: Record<string, any>

  /** 设计模式，可选值：live、design */
  designMode?: DesignMode

  /** 渲染模块是否挂起，当设置为 true 时，渲染模块最外层容器的 shouldComponentUpdate 将始终返回false，在下钻编辑或者多引擎渲染的场景会用到该参数。 */
  suspended?: boolean

  /** 组件获取 ref 时触发的钩子 */
  onCompGetRef?: (schema: NodeSchema, ref: any) => void

  /** 组件 ctx 更新回调 */
  onCompGetCtx?: (schema: NodeSchema, ref: any) => void

  /** 传入的 schema 是否有变更 */
  getSchemaChangedSymbol?: () => boolean

  /** 设置 schema 是否有变更 */
  setSchemaChangedSymbol?: (symbol: boolean) => void

  /** 自定义创建 element 的钩子 */
  customCreateElement?: (Component: any, props: any, children: any) => any

  /** 渲染类型，标识当前模块是以什么类型进行渲染的 */
  rendererName?: 'LowCodeRenderer' | 'PageRenderer' | string

  /** 当找不到组件时，显示的组件 */
  notFoundComponent?: React.ElementType<NotFoundComponentProps>

  /** 当组件渲染异常时，显示的组件 */
  faultComponent?: React.ElementType<FaultComponentProps>

  /** 设备信息 */
  device?: 'default' | 'pc' | 'mobile' | string

  /**
   * @default true
   * JSExpression 是否只支持使用 this 来访问上下文变量
   */
  thisRequiredInJSE?: boolean

  /**
   * @default false
   * 当开启组件未找到严格模式时，渲染模块不会默认给一个容器组件
   */
  enableStrictNotFoundMode?: boolean
}

export interface RendererState {
  engineRenderError?: boolean
  error?: Error
}

class Renderer extends Component<RendererProps> {
  static displayName = 'Renderer'

  state: Partial<RendererState> = {}

  __ref: any

  static defaultProps: RendererProps = {
    appHelper: undefined,
    components: {},
    designMode: 'design',
    suspended: false,
    schema: {} as RootSchema,
    onCompGetRef: () => {},
    onCompGetCtx: () => {},
    thisRequiredInJSE: true,
  }

  constructor(props: RendererProps) {
    super(props)
    this.state = {}
    logger.log(`entry.constructor - ${props?.schema?.componentName}`)
  }

  async componentDidMount() {
    logger.log(`entry.componentDidMount - ${this.props.schema && this.props.schema.componentName}`)
  }

  async componentDidUpdate() {
    logger.log(`entry.componentDidUpdate - ${this.props?.schema?.componentName}`)
  }

  async componentWillUnmount() {
    logger.log(`entry.componentWillUnmount - ${this.props?.schema?.componentName}`)
  }

  componentDidCatch(error: Error) {
    this.state.engineRenderError = true
    this.state.error = error
  }

  shouldComponentUpdate(nextProps: RendererProps) {
    return !nextProps.suspended
  }

  __getRef = (ref: any) => {
    this.__ref = ref
    if (ref) {
      this.props.onCompGetRef?.(this.props.schema, ref)
    }
  }

  isValidComponent(SetComponent: any) {
    return SetComponent
  }

  createElement(SetComponent: any, props: any, children?: any) {
    return (this.props.customCreateElement || createElement)(SetComponent, props, children)
  }

  getNotFoundComponent() {
    return this.props.notFoundComponent || NotFoundComponent
  }

  getFaultComponent() {
    return this.props.faultComponent || FaultComponent
  }

  getComp() {
    const { schema, components } = this.props
    const { componentName } = schema
    const Comp = components[componentName]
    // const allComponents = { ...RENDERER_COMPS, ...components }
    // let Comp = allComponents[componentName] || RENDERER_COMPS[`${componentName}Renderer`]
    // if (Comp && Comp.prototype) {
    //   if (!(Comp.prototype instanceof BaseRenderer)) {
    //     Comp = RENDERER_COMPS[`${componentName}Renderer`]
    //   }
    // }
    return Comp
  }

  render() {
    const { schema, designMode, appHelper, components } = this.props
    if (isEmpty(schema)) {
      return null
    }
    // 兼容乐高区块模板
    if (schema.componentName !== 'Div' && !isSchema(schema)) {
      logger.error(
        'The root component name needs to be one of Page、Block、Component, please check the schema: ',
        schema,
      )
      return '模型结构异常'
    }
    logger.log('entry.render')
    const Comp = this.getComp()

    if (this.state && this.state.engineRenderError) {
      return createElement(this.getFaultComponent(), {
        componentName: schema.componentName,
        error: this.state.error,
      })
    }

    if (Comp) {
      return createElement(
        RendererContext,
        {
          value: {
            appHelper,
            components,
            engine: this,
          },
        },
        createElement(Comp, {
          key: schema.__ctx && `${schema.__ctx.lceKey}_${schema.__ctx.idx || '0'}`,
          ref: this.__getRef,
          __appHelper: appHelper,
          __components: components,
          __schema: schema,
          __designMode: designMode,
          ...this.props,
        }),
      )
    }
    return null
  }
}
