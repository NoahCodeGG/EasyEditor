import type { NodeSchema, RootSchema, Simulator, SimulatorRenderer } from '@easy-editor/core'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useRendererContext } from './context'
import type { RendererAppHelper } from './renderer'
import { getValue, isSchema, logger } from './utils'

export function executeLifeCycleMethod(context: any, schema: NodeSchema, method: string, args: any): any {
  if (!context || !isSchema(schema) || !method) {
    return
  }
  const lifeCycleMethods = getValue(schema, 'lifeCycles', {})
  const fn = lifeCycleMethods[method]

  if (!fn) {
    return
  }

  if (typeof fn !== 'function') {
    logger.error(`生命周期${method}类型不符`, fn)
    return
  }

  try {
    return fn.apply(context, args)
  } catch (e) {
    logger.error(`[${schema.componentName}]生命周期${method}出错`, e)
  }
}

export function getSchemaChildren(schema: NodeSchema | undefined) {
  if (!schema) {
    return
  }

  if (!schema.props) {
    return schema.children
  }

  if (!schema.children) {
    return schema.props.children
  }

  if (!schema.props.children) {
    return schema.children
  }

  let result = ([] as NodeSchema[]).concat(schema.children)
  if (Array.isArray(schema.children)) {
    result = result.concat(schema.children)
  } else {
    result.push(schema.children)
  }
  return result
}

export interface BaseRendererProps {
  __appHelper: RendererAppHelper
  __components: Record<string, any>
  __ctx: Record<string, any>
  __schema: RootSchema
  __host?: Simulator
  __container?: SimulatorRenderer
  config?: Record<string, any>
  designMode?: 'design'
  className?: string
  style?: React.CSSProperties
  id?: string | number
  getSchemaChangedSymbol?: () => boolean
  setSchemaChangedSymbol?: (symbol: boolean) => void
  documentId?: string
  getNode?: any

  /**
   * 设备类型，默认值：'default'
   */
  device?: 'default' | 'pc' | 'mobile' | string
  componentName?: string
}

export const BaseRenderer: React.FC<BaseRendererProps> = memo(
  props => {
    const rendererContext = useRendererContext()
    const [state, setState] = useState<Record<string, any>>({})
    const __ref = useRef<any>(null)
    const __compScopes = useRef<Record<string, any>>({})
    const __instanceMap = useRef<Record<string, any>>({})
    const __styleElement = useRef<any>(null)

    const __executeLifeCycleMethod = (method: string, args?: any) => {
      executeLifeCycleMethod(rendererContext, props.__schema, method, args)
    }

    const __getComponentView = (componentName: string) => {
      const { __components } = props
      if (!__components) {
        return
      }
      return __components[componentName]
    }

    const __getRef = useCallback(
      (ref: any) => {
        const { engine } = rendererContext
        const { __schema } = props
        ref && engine?.props?.onCompGetRef(__schema, ref)
        __ref.current = ref
      },
      [rendererContext, props.__schema],
    )

    const __createDom = useCallback(() => {
      const { __schema, __ctx, __components = {} } = props
      const scopeProps = {
        ...__schema.defaultProps,
        ...props,
      }
      const scope: any = {
        props: scopeProps,
      }
      scope.__proto__ = __ctx || this

      const _children = getSchemaChildren(__schema)
      const Comp = __components[__schema.componentName]

      if (!Comp) {
        logger.warn(`${__schema.componentName} is invalid!`)
      }

      return null // Truncated for brevity
    }, [props])

    // lifecycle
    useEffect(() => {
      __executeLifeCycleMethod('componentDidMount')
      return () => {
        __executeLifeCycleMethod('componentDidUnmount')
      }
    }, [])

    useEffect(() => {
      __executeLifeCycleMethod('componentDidUpdate')
    }, [props.__schema])

    return null
  },
  (prevProps, nextProps) => {
    return prevProps.__schema === nextProps.__schema
  },
)
