import type { DesignMode, NodeSchema, RootSchema } from '@easy-editor/core'
import { memo, useCallback, useRef } from 'react'
import FaultComponent from './components/FaultComponent'
import NotFoundComponent from './components/NotFoundComponent'
import { RendererContext } from './context'

export interface RendererProps {
  /** 符合低代码搭建协议的数据 */
  schema: RootSchema | NodeSchema

  /** 组件依赖的实例 */
  components: Record<string, React.ReactNode>

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
  notFoundComponent?: React.ReactNode

  /** 当组件渲染异常时，显示的组件 */
  faultComponent?: React.ReactNode

  /**
   * @default false
   * 当开启组件未找到严格模式时，渲染模块不会默认给一个容器组件
   */
  enableStrictNotFoundMode?: boolean

  /** 设备信息 */
  device?: 'default' | 'pc' | 'mobile' | string
}

export interface RendererAppHelper {
  /** 全局公共函数 */
  utils?: Record<string, any>

  /** 全局常量 */
  constants?: Record<string, any>
}

export const Renderer: React.FC<RendererProps> = memo(props => {
  const __ref = useRef<any>(null)

  const getRef = useCallback(
    (ref: any) => {
      __ref.current = ref
      if (ref) {
        props.onCompGetRef?.(schema, ref)
      }
    },
    [schema, props.onCompGetRef],
  )

  const createElement = useCallback(
    (Component: any, props: any, children?: any) => {
      return props.customCreateElement ? (
        props.customCreateElement(Component, props, children)
      ) : (
        <Component {...props}>{children}</Component>
      )
    },
    [props.customCreateElement],
  )

  const getNotFoundComponent = useCallback(() => {
    return props.notFoundComponent || NotFoundComponent
  }, [props.notFoundComponent])

  const getFaultComponent = useCallback(() => {
    return props.faultComponent || FaultComponent
  }, [props.faultComponent])

  const getComp = useCallback(() => {
    const { componentName } = props.schema
    return props.components[componentName]
  }, [props.components, props.schema])

  if (props.suspended) {
    return null
  }

  if (!props.schema) {
    return null
  }

  const Comp = getComp()

  if (Comp) {
    return (
      <RendererContext
        value={{
          appHelper: props.appHelper,
          components: props.components,
          engine: {
            props,
            __ref: __ref.current,
          },
        }}
      >
        <Comp
          key={props.schema.id}
          ref={getRef}
          __appHelper={props.appHelper}
          __components={props.components}
          __schema={props.schema}
          __designMode={props.designMode}
          {...props}
        />
      </RendererContext>
    )
  }

  return null
})
