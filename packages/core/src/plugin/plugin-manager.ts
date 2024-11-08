import { createLogger } from '../utils'
import { PluginRuntime } from './plugin'
import { PluginContext, type PluginContextOptions } from './plugin-context'
import sequencify from './sequencify'

export interface PluginConfig {
  deps?: string[]
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

  /**
   * register a plugin
   * @param pluginConfigCreator - a creator function which returns the plugin config
   * @param options - the plugin options
   * @param registerOptions - the plugin register options
   */
  // async register(pluginModel: Plugin, registerOptions?: PluginRegisterOptions): Promise<void>
  async register(pluginModel: Plugin, options?: any, registerOptions?: PluginRegisterOptions): Promise<void> {
    if (isLowCodeRegisterOptions(options)) {
      registerOptions = options
      options = {}
    }

    const { pluginName, meta = {} } = pluginModel
    if (!pluginName) {
      this.logger.error('pluginConfigCreator.pluginName required', pluginModel)
      return
    }
    const ctx = this._getLowCodePluginContext({ pluginName, meta })
    const newPluginModel = pluginModel
    const newOptions = options
    const config = newPluginModel(ctx, newOptions)
    const allowOverride = registerOptions?.override === true

    if (this.pluginsMap.has(pluginName)) {
      if (allowOverride) {
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

    const plugin = new PluginRuntime(pluginName, this, config, meta)
    if (registerOptions?.autoInit) {
      await plugin.init()
    }
    this.plugins.push(plugin)
    this.pluginsMap.set(pluginName, plugin)
    this.logger.log(`plugin registered with pluginName: ${pluginName}, config: `, config, 'meta:', meta)
  }

  async registerPlugins(
    plugins: Plugin[] | Array<{ plugin: Plugin; options?: any }>,
    registerOptions?: PluginRegisterOptions,
  ) {
    for (const plugin of plugins) {
      if ('plugin' in plugin) {
        await this.register(plugin.plugin, plugin.options, registerOptions)
      } else {
        await this.register(plugin, undefined, registerOptions)
      }
    }
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

    // check plugin dependency
    const { missingTasks, sequence } = sequencify(pluginObj, pluginNames)
    if (missingTasks.length) {
      this.logger.error('plugin dependency missing', missingTasks)
      return
    }
    this.logger.log('load plugin sequence:', sequence)

    for (const pluginName of sequence) {
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
