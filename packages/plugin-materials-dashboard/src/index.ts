import type { Component, ComponentMetadata, PluginCreator } from '@easy-editor/core'
import * as components from './materials/component'
import * as componentMetas from './materials/meta'

const MaterialsDashboardPlugin: PluginCreator = () => {
  const componentMap = formatMapFromESModule<Component>(components)
  const componentMetaMap = formatMapFromESModule<ComponentMetadata>(componentMetas)

  return {
    name: 'MaterialsDashboardPlugin',
    deps: [],
    init(ctx) {
      const { logger, componentMetaManager, simulator } = ctx

      logger.log('register component', componentMap)
      logger.log('register component meta', componentMetaMap)

      simulator.buildComponentMap(componentMap)
      componentMetaManager.buildComponentMetasMap(componentMetaMap)
    },
  }
}

export default MaterialsDashboardPlugin

const formatMapFromESModule = <T>(map: Record<string, unknown>) => {
  return Object.keys(map).reduce<Record<string, T>>((result, key) => {
    result[key] = map[key] as T
    return result
  }, {})
}
