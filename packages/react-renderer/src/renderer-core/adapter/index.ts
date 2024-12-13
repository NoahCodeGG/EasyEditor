import type { BaseRenderComponent } from '../types'

export interface RendererModules {
  BaseRenderer?: BaseRenderComponent
  PageRenderer: BaseRenderComponent
  ComponentRenderer: BaseRenderComponent
}

class Adapter {
  renderers: RendererModules = {}

  setRenderers(renderers: RendererModules) {
    this.renderers = renderers
  }

  setBaseRenderer(BaseRenderer: BaseRenderComponent) {
    this.renderers.BaseRenderer = BaseRenderer
  }

  setPageRenderer(PageRenderer: BaseRenderComponent) {
    this.renderers.PageRenderer = PageRenderer
  }

  setComponentRenderer(ComponentRenderer: BaseRenderComponent) {
    this.renderers.ComponentRenderer = ComponentRenderer
  }

  getRenderers() {
    return this.renderers || {}
  }
}

export const adapter = new Adapter()
