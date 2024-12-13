import type { RendererModules } from '../types'

class Adapter {
  renderers: RendererModules

  setRenderers(renderers: RendererModules) {
    this.renderers = renderers
  }

  getRenderers() {
    return this.renderers || {}
  }
}

export const adapter = new Adapter()
