import type { ComponentMetaManager, Designer, Editor, Project, SetterManager, Simulator } from '..'
import { type EventBus, type Logger, createEventBus } from '../utils'
import type { PluginContextApiAssembler, PluginMeta } from './plugin-manager'

export interface PluginContextOptions {
  pluginName: string
  meta?: PluginMeta
}

export class PluginContext {
  // hotkey: IPublicApiHotkey
  editor: Editor
  simulator: Simulator
  designer: Designer
  project: Project
  setterManager: SetterManager
  componentMetaManager: ComponentMetaManager
  logger: Logger
  event: EventBus
  pluginEvent: EventBus

  constructor(options: PluginContextOptions, contextApiAssembler: PluginContextApiAssembler) {
    const { pluginName = 'anonymous', meta = {} } = options
    contextApiAssembler.assembleApis(this, pluginName, meta)
    this.pluginEvent = createEventBus(pluginName)
  }
}
