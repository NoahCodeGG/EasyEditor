import type { NodeSchema, RootSchema, Simulator, SimulatorRenderer } from '@easy-editor/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRendererContext } from './context'
import type { RendererAppHelper } from './renderer'
import { logger } from './utils'

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

export const BaseRenderer: React.FC<BaseRendererProps> = props => {
  const context = useRendererContext()
  const [state, setState] = useState<Record<string, any>>({})
  const __ref = useRef<any>(null)
  const __compScopes = useRef<Record<string, any>>({})
  const __instanceMap = useRef<Record<string, any>>({})
  const __styleElement = useRef<any>(null)

  // const __generateCtx = useCallback(
  //   (ctx: Record<string, any>) => {
  //     const { pageContext, compContext } = context
  //     const obj = {
  //       page: pageContext,
  //       component: compContext,
  //       ...ctx,
  //     }
  //     Object.keys(obj).forEach((key) => {
  //       this[key] = obj[key]
  //     })
  //   },
  //   [context],
  // )

  const __getRef = useCallback(
    (ref: any) => {
      const { engine } = context
      const { __schema } = props
      ref && engine?.props?.onCompGetRef(__schema, ref)
      __ref.current = ref
    },
    [context, props.__schema],
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

  useEffect(() => {
    // Component mount logic
    return () => {
      // Cleanup
    }
  }, [])

  return null
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
