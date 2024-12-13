import { Component, PureComponent, createElement } from 'react'
import type { RendererProps } from '../renderer'
import type { BaseRendererInstance } from '../types'
import { createForwardRefHocElement } from '../utils'

interface Options {
  baseRenderer: BaseRendererInstance
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
      const { forwardRef, ...rest } = this.props
      return createElement(Comp, { ...rest, ref: forwardRef })
    }
  }
  ;(Wrapper as any).displayName = Comp.displayName

  patchDidCatch(Wrapper, options)

  const WrapperComponent = createForwardRefHocElement(Wrapper, Comp)

  cache.set(options.schema.id, { WrapperComponent, Comp })

  return WrapperComponent
}
