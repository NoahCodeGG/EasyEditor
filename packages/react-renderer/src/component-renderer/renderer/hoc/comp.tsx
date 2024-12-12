import { Component, PureComponent, createElement, forwardRef } from 'react'
import type { BaseRenderer } from '../base'
import type { RendererProps } from '../renderer'

interface Options {
  baseRenderer: BaseRenderer
  schema: any
}

function patchDidCatch(Comp: any, { baseRenderer }: Options) {
  if (Comp.patchedCatch) {
    return
  }
  Comp.patchedCatch = true
  const originalDidCatch = Comp.prototype.componentDidCatch
  Comp.prototype.componentDidCatch = function didCatch(this: any, error: Error, errorInfo: any) {
    this.setState({ engineRenderError: true, error })
    if (originalDidCatch && typeof originalDidCatch === 'function') {
      originalDidCatch.call(this, error, errorInfo)
    }
  }

  const { engine } = baseRenderer.context
  const originRender = Comp.prototype.render
  Comp.prototype.render = function () {
    if (this.state && this.state.engineRenderError) {
      this.state.engineRenderError = false
      return engine.createElement(engine.getFaultComponent(), {
        ...this.props,
        error: this.state.error,
        componentName: this.props._componentName,
      })
    }
    return originRender.call(this)
  }
  if (!(Comp.prototype instanceof PureComponent)) {
    const originShouldComponentUpdate = Comp.prototype.shouldComponentUpdate
    Comp.prototype.shouldComponentUpdate = function (nextProps: RendererProps, nextState: any) {
      if (nextState && nextState.engineRenderError) {
        return true
      }
      return originShouldComponentUpdate ? originShouldComponentUpdate.call(this, nextProps, nextState) : true
    }
  }
}

const cache = new Map<string, { Comp: any; WrapperComponent: any }>()

export function compWrapper(Comp: any, options: Options) {
  if (Comp?.prototype?.isReactComponent || Comp?.prototype instanceof Component) {
    patchDidCatch(Comp, options)
    return Comp
  }

  if (cache.has(options.schema.id) && cache.get(options.schema.id)?.Comp === Comp) {
    return cache.get(options.schema.id)?.WrapperComponent
  }

  class Wrapper extends Component {
    render() {
      return createElement(Comp, { ...this.props, ref: this.props.forwardRef })
    }
  }
  ;(Wrapper as any).displayName = Comp.displayName

  patchDidCatch(Wrapper, options)

  const WrapperComponent = cloneEnumerableProperty(
    forwardRef((props: any, ref: any) => {
      return createElement(Wrapper, { ...props, forwardRef: ref })
    }),
    Comp,
  )

  cache.set(options.schema.id, { WrapperComponent, Comp })

  return WrapperComponent
}

const excludePropertyNames = [
  '$$typeof',
  'render',
  'defaultProps',
  'props',
  'length',
  'prototype',
  'name',
  'caller',
  'callee',
  'arguments',
]

export function cloneEnumerableProperty(target: any, origin: any, excludes = excludePropertyNames) {
  const compExtraPropertyNames = Object.keys(origin).filter(d => !excludes.includes(d))

  compExtraPropertyNames.forEach((d: string) => {
    ;(target as any)[d] = origin[d]
  })

  return target
}
