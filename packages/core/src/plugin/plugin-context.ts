import { type EventBus, createEventBus } from '@/utils'
import type { PluginMeta } from './plugin-manager'

export interface PluginContextOptions {
  pluginName: string
  meta?: PluginMeta
}

export class PluginContext {
  // hotkey: IPublicApiHotkey
  // project: IPublicApiProject
  // skeleton: IPublicApiSkeleton
  // setters: IPublicApiSetters
  // material: IPublicApiMaterial
  // event: IPublicApiEvent
  // config: IPublicModelEngineConfig
  // common: IPublicApiCommon
  // logger: IPublicApiLogger
  // plugins: IPublicApiPlugins
  // preference: IPluginPreferenceMananger
  pluginEvent: EventBus
  // canvas: IPublicApiCanvas
  // workspace: IPublicApiWorkspace
  // registerLevel: IPublicEnumPluginRegisterLevel
  // editorWindow: IPublicModelWindow

  constructor(options: PluginContextOptions) {
    const { pluginName = 'anonymous', meta = {} } = options
    this.pluginEvent = createEventBus(pluginName)
    // const enhancePluginContextHook = engineConfig.get('enhancePluginContextHook')
    // if (enhancePluginContextHook) {
    // enhancePluginContextHook(this)
    // }
  }

  // setPreference(pluginName: string, preferenceDeclaration: IPublicTypePluginDeclaration): void {
  //   const getPreferenceValue = (
  //     key: string,
  //     defaultValue?: IPublicTypePreferenceValueType,
  //   ): IPublicTypePreferenceValueType | undefined => {
  //     if (!isValidPreferenceKey(key, preferenceDeclaration)) {
  //       return undefined
  //     }
  //     const pluginPreference = this.plugins.getPluginPreference(pluginName) || {}
  //     if (pluginPreference[key] === undefined || pluginPreference[key] === null) {
  //       return defaultValue
  //     }
  //     return pluginPreference[key]
  //   }

  //   this.preference = {
  //     getPreferenceValue,
  //   }
  // }
}
