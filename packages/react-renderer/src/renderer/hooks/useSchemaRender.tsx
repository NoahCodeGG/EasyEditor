import type { NodeSchema, RootSchema, Simulator, SimulatorRenderer } from '@easy-editor/core'
import { useCallback, useEffect, useRef } from 'react'
import { useRendererContext } from '../context'
import type { RendererAppHelper } from '../renderer'
import {
  parseData as _parseData,
  checkPropTypes,
  getValue,
  isSchema,
  isUseLoop,
  logger,
  transformArrayToMap,
} from '../utils'

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

export interface SchemaRendererProps {
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

interface NodeInfo {
  schema?: NodeSchema
  Comp: any
  componentInfo?: any
  componentChildren?: any
}

export function useSchemaRender(props: SchemaRendererProps) {
  const rendererContext = useRendererContext()
  const { engine } = rendererContext
  const { __schema, __components } = props

  const compRef = useRef<any>(null)
  const designModeIsDesign = engine.props.designMode === 'design'

  const executeLifeCycle = useCallback(
    (method: string, args?: any) => {
      executeLifeCycleMethod(rendererContext, __schema, method, args)
    },
    [rendererContext, __schema],
  )

  const getComponentView = useCallback(
    (componentName: string) => {
      if (!__components) {
        return
      }
      return __components[componentName]
    },
    [__components],
  )

  const getRef = useCallback(
    (ref: any) => {
      ref && engine?.props?.onCompGetRef(__schema, ref)
      compRef.current = ref
    },
    [engine, __schema],
  )

  const parseData = useCallback(
    (schema: any, ctx?: Record<string, any>) => {
      return _parseData(schema, ctx || {}, { logScope: __schema.componentName })
    },
    [__schema],
  )

  const render = useCallback(() => {
    const schema = __schema
    executeLifeCycle('render')

    if (engine) {
      engine.props.onCompGetCtx(schema, {})
    }
  }, [engine, __schema])

  const createDom = useCallback(() => {
    const { __schema, __ctx, __components = {} } = props
    // merge defaultProps
    const scopeProps = {
      ...__schema.defaultProps,
      ...props,
    }
    const scope: any = {
      props: scopeProps,
    }
    scope.__proto__ = __ctx || {}

    const _children = getSchemaChildren(__schema)
    const Comp = __components[__schema.componentName]

    if (!Comp) {
      logger.error(`${__schema.componentName} is invalid!`)
    }
    const parentNodeInfo = {
      schema: __schema,
      Comp: engine.createElement(Comp, __schema, scope),
    } as NodeInfo
    return createVirtualDom(_children, scope, parentNodeInfo)
  }, [props])

  const createVirtualDom = (
    originalSchema: NodeSchema | NodeSchema[] | undefined,
    originalScope: any,
    parentInfo: NodeInfo,
    idx: string | number = '',
  ): any => {
    if (originalSchema === null || originalSchema === undefined) {
      return null
    }
    const scope = originalScope
    const schema = originalSchema
    if (!engine) {
      logger.error('this.context.engine is invalid!')
      return null
    }
    try {
      const { __appHelper: appHelper, __components: components = {} } = props || {}

      if (typeof schema === 'string') {
        return schema
      }

      if (typeof schema === 'number' || typeof schema === 'boolean') {
        return String(schema)
      }

      if (Array.isArray(schema)) {
        if (schema.length === 1) {
          return createVirtualDom(schema[0], scope, parentInfo)
        }
        return schema.map((item, idy) =>
          createVirtualDom(item, scope, parentInfo, (item as NodeSchema)?.__ctx?.lceKey ? '' : String(idy)),
        )
      }

      if (schema.$$typeof) {
        return schema
      }

      const _children = getSchemaChildren(schema)
      if (!schema.componentName) {
        logger.error('The componentName in the schema is invalid, please check the schema: ', schema)
        return
      }

      if (!isSchema(schema)) {
        return null
      }
      const Comp = components[schema.componentName] || props.__container?.components?.[schema.componentName]

      // 容器类组件的上下文通过props传递，避免context传递带来的嵌套问题
      const otherProps: any = isSchema(schema)
        ? {
            __schema: schema,
            __appHelper: appHelper,
            __components: components,
          }
        : {}

      if (!Comp) {
        logger.error(
          `${schema.componentName} component is not found in components list! component list is:`,
          components || props.__container?.components,
        )
        return engine.createElement(
          engine.getNotFoundComponent(),
          {
            componentName: schema.componentName,
            componentId: schema.id,
            enableStrictNotFoundMode: engine.props.enableStrictNotFoundMode,
            ref: (ref: any) => {
              ref && engine.props?.onCompGetRef(schema, ref)
            },
          },
          getSchemaChildrenVirtualDom(schema, scope, Comp),
        )
      }

      if (schema.loop != null) {
        const loop = parseData(schema.loop, scope)
        if (Array.isArray(loop) && loop.length === 0) return null
        const useLoop = isUseLoop(loop, designModeIsDesign)
        if (useLoop) {
          return createLoopVirtualDom(
            {
              ...schema,
              loop,
            },
            scope,
            parentInfo,
            idx,
          )
        }
      }
      const condition = schema.condition == null ? true : parseData(schema.condition, scope)

      // DesignMode 为 design 情况下，需要进入 leaf Hoc，进行相关事件注册
      const displayInHook = designModeIsDesign
      if (!condition && !displayInHook) {
        return null
      }

      // let scopeKey = '';
      // // 判断组件是否需要生成scope，且只生成一次，挂在this.__compScopes上
      // if (Comp.generateScope) {
      //   const key = this.__parseExpression(schema.props?.key, scope);
      //   if (key) {
      //     // 如果组件自己设置key则使用组件自己的key
      //     scopeKey = key;
      //   } else if (!schema.__ctx) {
      //     // 在生产环境schema没有__ctx上下文，需要手动生成一个lceKey
      //     schema.__ctx = {
      //       lceKey: `lce${++scopeIdx}`,
      //     };
      //     scopeKey = schema.__ctx.lceKey;
      //   } else {
      //     // 需要判断循环的情况
      //     scopeKey = schema.__ctx.lceKey + (idx !== undefined ? `_${idx}` : '');
      //   }
      //   if (!this.__compScopes[scopeKey]) {
      //     this.__compScopes[scopeKey] = Comp.generateScope(this, schema);
      //   }
      // }
      // // 如果组件有设置scope，需要为组件生成一个新的scope上下文
      // if (scopeKey && this.__compScopes[scopeKey]) {
      //   const compSelf = { ...this.__compScopes[scopeKey] };
      //   compSelf.__proto__ = scope;
      //   scope = compSelf;
      // }

      if (engine.props?.designMode) {
        otherProps.__designMode = engine.props.designMode
      }
      if (designModeIsDesign) {
        otherProps.__tag = Math.random()
      }
      const componentInfo: any = {}
      const props: any =
        getComponentProps(schema, scope, Comp, {
          ...componentInfo,
          props: transformArrayToMap(componentInfo.props, 'name'),
        }) || {}

      // this.__componentHOCs.forEach((ComponentConstruct: IComponentConstruct) => {
      //   Comp = ComponentConstruct(Comp, {
      //     schema,
      //     componentInfo,
      //     baseRenderer: this,
      //     scope,
      //   });
      // });

      otherProps.ref = (ref: any) => {
        this.$(props.fieldId || props.ref, ref) // 收集ref
        const refProps = props.ref
        if (refProps && typeof refProps === 'string') {
          this[refProps] = ref
        }
        ref && engine.props?.onCompGetRef(schema, ref)
      }

      // scope需要传入到组件上
      // if (scopeKey && this.__compScopes[scopeKey]) {
      //   props.__scope = this.__compScopes[scopeKey];
      // }
      if (schema?.__ctx?.lceKey) {
        if (!isSchema(schema)) {
          engine.props?.onCompGetCtx(schema, scope)
        }
        props.key = props.key || `${schema.__ctx.lceKey}_${schema.__ctx.idx || 0}_${idx !== undefined ? idx : ''}`
      } else if ((typeof idx === 'number' || typeof idx === 'string') && !props.key) {
        // 仅当循环场景走这里
        props.key = idx
      }

      props.__id = schema.id
      if (!props.key) {
        props.key = props.__id
      }

      const child = getSchemaChildrenVirtualDom(schema, scope, Comp, condition)
      const renderComp = (innerProps: any) => engine.createElement(Comp, innerProps, child)

      return renderComp({
        ...props,
        ...otherProps,
        __inner__: {
          hidden: schema.hidden,
          condition,
        },
      })
    } catch (e) {
      return engine.createElement(engine.getFaultComponent(), {
        error: e,
        schema,
        self: scope,
        parentInfo,
        idx,
      })
    }
  }

  const __getSchemaChildrenVirtualDom = (schema: NodeSchema | undefined, scope: any, Comp: any, condition = true) => {
    let children = condition ? getSchemaChildren(schema) : null

    const result: any = []
    if (children) {
      if (!Array.isArray(children)) {
        children = [children]
      }

      children.forEach((child: any) => {
        const childVirtualDom = createVirtualDom(child, scope, {
          schema,
          Comp,
        })

        result.push(childVirtualDom)
      })
    }

    if (result && result.length > 0) {
      return result
    }
    return null
  }

  const createLoopVirtualDom = (schema: NodeSchema, scope: any, parentInfo: NodeInfo, idx: number | string) => {
    // if (isSchema(schema)) {
    //   logger.warn('file type not support Loop');
    //   return null;
    // }
    // if (!Array.isArray(schema.loop)) {
    //   return null;
    // }
    // const itemArg = (schema.loopArgs && schema.loopArgs[0]) || DEFAULT_LOOP_ARG_ITEM;
    // const indexArg = (schema.loopArgs && schema.loopArgs[1]) || DEFAULT_LOOP_ARG_INDEX;
    // const { loop } = schema;
    // return loop.map((item: IPublicTypeJSONValue | IPublicTypeCompositeValue, i: number) => {
    //   const loopSelf: any = {
    //     [itemArg]: item,
    //     [indexArg]: i,
    //   };
    //   loopSelf.__proto__ = scope;
    //   return this.__createVirtualDom(
    //     {
    //       ...schema,
    //       loop: undefined,
    //       props: {
    //         ...schema.props,
    //         // 循环下 key 不能为常量，这样会造成 key 值重复，渲染异常
    //         key: isJSExpression(schema.props?.key) ? schema.props?.key : null,
    //       },
    //     },
    //     loopSelf,
    //     parentInfo,
    //     idx ? `${idx}_${i}` : i,
    //   );
    // });
  }

  const getComponentProps = (schema: NodeSchema | undefined, scope: any, Comp: any, componentInfo?: any) => {
    if (!schema) {
      return {}
    }
    return (
      parseProps(schema?.props, scope, '', {
        schema,
        Comp,
        componentInfo: {
          ...(componentInfo || {}),
          props: transformArrayToMap((componentInfo || {}).props, 'name'),
        },
      }) || {}
    )
  }

  const parseProps = (originalProps: any, scope: any, path: string, info: NodeInfo): any => {
    const props = originalProps
    const { schema, Comp, componentInfo = {} } = info
    const propInfo = getValue(componentInfo.props, path)
    // FIXME: 将这行逻辑外置，解耦，线上环境不要验证参数，调试环境可以有，通过传参自定义
    const propType = propInfo?.extra?.propType

    const checkProps = (value: any) => {
      if (!propType) {
        return value
      }
      return checkPropTypes(value, path, propType, componentInfo.name) ? value : undefined
    }

    const parseReactNode = (data: any, params: any) => {
      if (!params) {
        const virtualDom = createVirtualDom(data, scope, { schema, Comp } as NodeInfo)
        return checkProps(virtualDom)
      }
      return checkProps((...argValues: any[]) => {
        const args: any = {}
        if (Array.isArray(params) && params.length) {
          params.forEach((item, idx) => {
            if (typeof item === 'string') {
              args[item] = argValues[idx]
            } else if (item && typeof item === 'object') {
              args[item.name] = argValues[idx]
            }
          })
        }
        args.__proto__ = scope
        return scope.createVirtualDom(data, args, { schema, Comp } as NodeInfo)
      })
    }

    // 兼容通过componentInfo判断的情况
    if (isSchema(props)) {
      const isReactNodeFunction = !!(propInfo?.type === 'ReactNode' && propInfo?.props?.type === 'function')

      const isMixinReactNodeFunction = !!(
        propInfo?.type === 'Mixin' &&
        propInfo?.props?.types?.indexOf('ReactNode') > -1 &&
        propInfo?.props?.reactNodeProps?.type === 'function'
      )

      let params = null
      if (isReactNodeFunction) {
        params = propInfo?.props?.params
      } else if (isMixinReactNodeFunction) {
        params = propInfo?.props?.reactNodeProps?.params
      }
      return parseReactNode(props, params)
    }
    if (Array.isArray(props)) {
      return checkProps(props.map((item, idx) => parseProps(item, scope, path ? `${path}.${idx}` : `${idx}`, info)))
    }
    if (typeof props === 'function') {
      return checkProps(props.bind(scope))
    }
    if (props && typeof props === 'object') {
      if (props.$$typeof) {
        return checkProps(props)
      }
      const res: any = {}
      Object.entries(props).forEach(([key, val]) => {
        if (key.startsWith('__')) {
          res[key] = val
          return
        }
        res[key] = parseProps(val, scope, path ? `${path}.${key}` : key, info)
      })
      return checkProps(res)
    }
    return checkProps(props)
  }

  const $ = (filedId: string, instance?: any) => {
    // this.__instanceMap = this.__instanceMap || {};
    // if (!filedId || typeof filedId !== 'string') {
    //   return this.__instanceMap;
    // }
    // if (instance) {
    //   this.__instanceMap[filedId] = instance;
    // }
    // return this.__instanceMap[filedId];
  }

  const renderComp = (OriginalComp: any, ctxProps: object) => {
    const Comp = OriginalComp
    const { __schema, __ctx } = props
    const scope: any = {}
    scope.__proto__ = __ctx || this
    // Comp = this.__getHOCWrappedComponent(Comp, __schema, scope)
    const data = parseProps(__schema?.props, scope, '', {
      schema: __schema,
      Comp,
      componentInfo: {},
    })
    const { className } = data
    const otherProps: any = {}
    if (!engine) {
      return null
    }

    if (designModeIsDesign) {
      otherProps.__tag = Math.random()
    }

    const child = engine.createElement(
      Comp,
      {
        ...data,
        ...props,
        ref: getRef,
        // className: classnames(getFileCssName(__schema?.fileName), className, this.props.className),
        __id: __schema?.id,
        ...otherProps,
      },
      createDom(),
    )
    return renderContextProvider(ctxProps, child)
  }

  const checkSchema = (schema: NodeSchema | undefined, originalExtraComponents: string | string[] = []) => {
    let extraComponents = originalExtraComponents
    if (typeof extraComponents === 'string') {
      extraComponents = [extraComponents]
    }

    // const builtin = capitalizeFirstLetter(this.__namespace);
    const componentNames = [...extraComponents]
    return !isSchema(schema) || !componentNames.includes(schema?.componentName ?? '')
  }

  const renderContextProvider = (customProps?: object, children?: any) => {
    // return createElement(AppContext.Provider, {
    //   value: {
    //     ...rendererContext,
    //     blockContext: this,
    //     ...(customProps || {}),
    //   },
    //   children: children || this.__createDom(),
    // });
  }

  // lifecycle
  useEffect(() => {
    executeLifeCycle('componentDidMount')
    return () => {
      executeLifeCycle('componentWillUnmount')
    }
  }, [])

  useEffect(() => {
    executeLifeCycle('componentDidUpdate')
  }, [__schema])

  return {
    compRef,
    executeLifeCycle,
    getComponentView,
    getRef,
  }
}
