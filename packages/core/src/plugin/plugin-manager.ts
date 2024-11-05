import { createLogger } from '@/utils'
import { PluginRuntime } from './plugin'
import { PluginContext, type PluginContextOptions } from './plugin-context'

export interface PluginConfig {
  init(): Promise<void> | void
  destroy?(): Promise<void> | void
  exports?(): any
}

export interface PluginMeta {
  /**
   * define dependencies which the plugin depends on
   */
  dependencies?: string[]
  /**
   * specify which engine version is compatible with the plugin
   */
  engines?: {
    /** e.g. '^1.0.0' */
    lowcodeEngine?: string
  }
  // preferenceDeclaration?: IPublicTypePluginDeclaration

  /**
   * use 'common' as event prefix when eventPrefix is not set.
   * strongly recommend using pluginName as eventPrefix
   *
   * eg.
   *   case 1, when eventPrefix is not specified
   *        event.emit('someEventName') is actually sending event with name 'common:someEventName'
   *
   *   case 2, when eventPrefix is 'myEvent'
   *        event.emit('someEventName') is actually sending event with name 'myEvent:someEventName'
   */
  eventPrefix?: string
}

export type PluginCreator = (ctx: PluginContext, options: any) => PluginConfig

export interface Plugin extends PluginCreator {
  pluginName: string
  meta?: PluginMeta
}

export interface PluginRegisterOptions {
  /**
   * Will enable plugin registered with auto-initialization immediately
   * other than plugin-manager init all plugins at certain time.
   * It is helpful when plugin register is later than plugin-manager initialization.
   */
  autoInit?: boolean
  /**
   * allow overriding existing plugin with same name when override === true
   */
  override?: boolean
}

export interface PluginContextApiAssembler {
  assembleApis(context: PluginContext, pluginName: string, meta: PluginMeta): void
}

export class PluginManager {
  private logger = createLogger('PluginManager')

  private plugins: PluginRuntime[] = []

  pluginsMap: Map<string, PluginRuntime> = new Map()
  pluginContextMap: Map<string, PluginContext> = new Map()

  // private pluginPreference?: PluginPreference = new Map()

  contextApiAssembler: PluginContextApiAssembler

  constructor(contextApiAssembler: PluginContextApiAssembler) {
    this.contextApiAssembler = contextApiAssembler
  }

  _getLowCodePluginContext = (options: PluginContextOptions) => {
    const { pluginName } = options
    let context = this.pluginContextMap.get(pluginName)
    if (!context) {
      context = new PluginContext(options, this.contextApiAssembler)
      this.pluginContextMap.set(pluginName, context)
    }
    return context
  }

  // isEngineVersionMatched(versionExp: string): boolean {
  //   const engineVersion = engineConfig.get('ENGINE_VERSION')
  //   // ref: https://github.com/npm/node-semver#functions
  //   // 1.0.1-beta should match '^1.0.0'
  //   return semverSatisfies(engineVersion, versionExp, { includePrerelease: true })
  // }

  /**
   * register a plugin
   * @param pluginConfigCreator - a creator function which returns the plugin config
   * @param options - the plugin options
   * @param registerOptions - the plugin register options
   */
  async register(pluginModel: Plugin, options?: any, registerOptions?: PluginRegisterOptions): Promise<void> {
    // registerOptions maybe in the second place
    if (isLowCodeRegisterOptions(options)) {
      registerOptions = options
      options = {}
    }
    let { pluginName, meta = {} } = pluginModel
    // const { engines } = meta
    // filter invalid eventPrefix
    // const { eventPrefix } = meta
    // const isReservedPrefix = RESERVED_EVENT_PREFIX.find(item => item === eventPrefix)
    // if (isReservedPrefix) {
    //   meta.eventPrefix = undefined
    //   logger.warn(
    //     `plugin ${pluginName} is trying to use ${eventPrefix} as event prefix, which is a reserved event prefix, please use another one`,
    //   )
    // }
    const ctx = this._getLowCodePluginContext({ pluginName, meta })
    // const customFilterValidOptions = engineConfig.get('customPluginFilterOptions', filterValidOptions)
    // const pluginTransducer = engineConfig.get('customPluginTransducer', null)
    // const newPluginModel = pluginTransducer ? await pluginTransducer(pluginModel, ctx, options) : pluginModel
    const newPluginModel = pluginModel
    // const newOptions = customFilterValidOptions(options, newPluginModel.meta?.preferenceDeclaration)
    const newOptions = options
    const config = newPluginModel(ctx, newOptions)
    // compat the legacy way to declare pluginName
    // @ts-ignore
    pluginName = pluginName || config.name
    this.logger.error('pluginConfigCreator.pluginName required', config)

    // ctx.setPreference(pluginName, preferenceDeclaration)

    const allowOverride = registerOptions?.override === true

    if (this.pluginsMap.has(pluginName)) {
      if (allowOverride) {
        // clear existing plugin
        const originalPlugin = this.pluginsMap.get(pluginName)
        this.logger.log(
          'plugin override, originalPlugin with name ',
          pluginName,
          ' will be destroyed, config:',
          originalPlugin?.config,
        )
        originalPlugin?.destroy()
        this.pluginsMap.delete(pluginName)
      } else {
        throw new Error(`Plugin with name ${pluginName} exists`)
      }
    }

    // const engineVersionExp = engines && engines.lowcodeEngine
    // if (engineVersionExp && !this.isEngineVersionMatched(engineVersionExp)) {
    //   throw new Error(
    //     `plugin ${pluginName} skipped, engine check failed, current engine version is ${engineConfig.get('ENGINE_VERSION')}, meta.engines.lowcodeEngine is ${engineVersionExp}`,
    //   )
    // }

    const plugin = new PluginRuntime(pluginName, this, config, meta)
    // support initialization of those plugins which registered
    // after normal initialization by plugin-manager
    if (registerOptions?.autoInit) {
      await plugin.init()
    }
    this.plugins.push(plugin)
    this.pluginsMap.set(pluginName, plugin)
    this.logger.log(`plugin registered with pluginName: ${pluginName}, config: `, config, 'meta:', meta)
  }

  get(pluginName: string): PluginRuntime | undefined {
    return this.pluginsMap.get(pluginName)
  }

  getAll(): PluginRuntime[] {
    return this.plugins
  }

  has(pluginName: string): boolean {
    return this.pluginsMap.has(pluginName)
  }

  async delete(pluginName: string): Promise<boolean> {
    const plugin = this.plugins.find(({ name }) => name === pluginName)
    if (!plugin) return false
    await plugin.destroy()
    const idx = this.plugins.indexOf(plugin)
    this.plugins.splice(idx, 1)
    return this.pluginsMap.delete(pluginName)
  }

  async init() {
    const pluginNames: string[] = []
    const pluginObj: { [name: string]: PluginRuntime } = {}
    this.plugins.forEach(plugin => {
      pluginNames.push(plugin.name)
      pluginObj[plugin.name] = plugin
    })
    // const { missingTasks, sequence } = sequencify(pluginObj, pluginNames)
    // this.logger.error(!missingTasks.length, 'plugin dependency missing', missingTasks)
    // this.logger.log('load plugin sequence:', sequence)

    // for (const pluginName of sequence) {
    for (const pluginName of pluginNames) {
      try {
        await this.pluginsMap.get(pluginName)!.init()
      } catch (e) {
        this.logger.error(`Failed to init plugin:${pluginName}, it maybe affect those plugins which depend on this.`)
        this.logger.error(e)
      }
    }
  }

  async destroy() {
    for (const plugin of this.plugins) {
      await plugin.destroy()
    }
  }

  get size() {
    return this.pluginsMap.size
  }

  // getPluginPreference(pluginName: string): Record<string, IPublicTypePreferenceValueType> | null | undefined {
  //   if (!this.pluginPreference) {
  //     return null
  //   }
  //   return this.pluginPreference.get(pluginName)
  // }

  // toProxy() {
  //   return new Proxy(this, {
  //     get(target, prop, receiver) {
  //       if (target.pluginsMap.has(prop as string)) {
  //         // 禁用态的插件，直接返回 undefined
  //         if (target.pluginsMap.get(prop as string)!.disabled) {
  //           return undefined
  //         }
  //         return target.pluginsMap.get(prop as string)?.toProxy()
  //       }
  //       return Reflect.get(target, prop, receiver)
  //     },
  //   })
  // }

  setDisabled(pluginName: string, flag = true) {
    this.logger.warn(`plugin:${pluginName} has been set disable:${flag}`)
    this.pluginsMap.get(pluginName)?.setDisabled(flag)
  }

  async dispose() {
    await this.destroy()
    this.plugins = []
    this.pluginsMap.clear()
  }
}

export const isLowCodeRegisterOptions = (opts: any): opts is PluginRegisterOptions => {
  return opts && ('autoInit' in opts || 'override' in opts)
}
