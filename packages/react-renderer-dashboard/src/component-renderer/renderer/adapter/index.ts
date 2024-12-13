import type { RendererModules } from '../types'

class Adapter {
  renderers: RendererModules

  configProvider: any

  setRenderers(renderers: RendererModules) {
    this.renderers = renderers
  }

  getRenderers() {
    return this.renderers || {}
  }

  setConfigProvider(Comp: any) {
    this.configProvider = Comp
  }

  getConfigProvider() {
    return this.configProvider
  }
}

export const adapter = new Adapter()
