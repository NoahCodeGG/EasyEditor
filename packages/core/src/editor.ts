import { action, observable } from 'mobx'
import { Designer } from './designer'
import { ComponentMetaManager, SetterManager } from './meta'
import { type PluginContextApiAssembler, PluginManager } from './plugin'
import { Simulator } from './simulator'
import { type EventBus, createEventBus } from './utils'

export type EditorValueKey = string | symbol

export type EditorGetResult<T, ClsType> = T extends undefined
  ? ClsType extends {
      prototype: infer R
    }
    ? R
    : any
  : T

export interface EditorConfig {
  // plugins?: PluginsConfig
  hooks?: HooksConfig
  hotkeys?: HotkeysConfig
  utils?: UtilsConfig
  constants?: ConstantsConfig
  lifeCycles?: LifeCyclesConfig
}

// export interface PluginsConfig {
//   [key: string]: PluginConfig[]
// }

// export interface PluginConfig {
//   pluginKey: string
//   type: string
//   props: {
//     icon?: string
//     title?: string
//     width?: number
//     height?: number
//     visible?: boolean
//     disabled?: boolean
//     marked?: boolean
//     align?: 'left' | 'right' | 'top' | 'bottom'
//     onClick?: () => void
//     dialogProps?: Record<string, unknown>
//     balloonProps?: Record<string, unknown>
//     panelProps?: Record<string, unknown>
//     linkProps?: Record<string, unknown>
//   }
//   pluginProps?: Record<string, unknown>
// }

export type HooksConfig = HookConfig[]

export interface HookConfig {
  message: string
  type: 'on' | 'once'
  handler: (this: Editor, editor: Editor, ...args: any[]) => void
}

export type HotkeysConfig = HotkeyConfig[]

export interface HotkeyConfig {
  keyboard: string
  handler: (editor: Editor, ev: Event, keymaster: any) => void
}

export type UtilsConfig = UtilConfig[]

export interface UtilConfig {
  name: string
  type: 'function'
  content: (...args: []) => any
}

export type ConstantsConfig = Record<string, unknown>

export interface LifeCyclesConfig {
  init?: (editor: Editor) => any
  destroy?: (editor: Editor) => any
}

export class Editor {
  @observable.shallow private accessor context = new Map<EditorValueKey, any>()

  config?: EditorConfig

  eventBus: EventBus

  // components?: PluginClassSet

  // readonly utils = utils;

  // private hooks: HookConfig[] = []

  private waits = new Map<
    EditorValueKey,
    Array<{
      once?: boolean
      resolve: (data: any) => void
    }>
  >()

  constructor() {
    this.eventBus = createEventBus('EasyEditor')
  }

  get<T = undefined, KeyOrType = any>(keyOrType: KeyOrType): EditorGetResult<T, KeyOrType> | undefined {
    return this.context.get(keyOrType as any)
  }

  has(keyOrType: EditorValueKey): boolean {
    return this.context.has(keyOrType)
  }

  @action
  set(key: EditorValueKey, data: any): void | Promise<void> {
    // if (key === 'assets') {
    //   return this.setAssets(data)
    // }

    this.context.set(key, data)
    this.notifyGot(key)
  }

  // async setAssets(assets: IPublicTypeAssetsJson) {
  //   const { components } = assets
  //   if (components && components.length) {
  //     const componentDescriptions: IPublicTypeComponentDescription[] = []
  //     const remoteComponentDescriptions: IPublicTypeRemoteComponentDescription[] = []
  //     components.forEach((component: any) => {
  //       if (!component) {
  //         return
  //       }
  //       if (component.exportName && component.url) {
  //         remoteComponentDescriptions.push(component)
  //       } else {
  //         componentDescriptions.push(component)
  //       }
  //     })
  //     assets.components = componentDescriptions
  //     assets.componentList = assets.componentList || []

  //     // 如果有远程组件描述协议，则自动加载并补充到资产包中，同时出发 designer.incrementalAssetsReady 通知组件面板更新数据
  //     if (remoteComponentDescriptions && remoteComponentDescriptions.length) {
  //       await Promise.all(
  //         remoteComponentDescriptions.map(async (component: IPublicTypeRemoteComponentDescription) => {
  //           const { exportName, url, npm } = component
  //           if (!url || !exportName) {
  //             return
  //           }
  //           if (!AssetsCache[exportName] || !npm?.version || AssetsCache[exportName].npm?.version !== npm?.version) {
  //             await new AssetLoader().load(url)
  //           }
  //           AssetsCache[exportName] = component
  //           function setAssetsComponent(component: any, extraNpmInfo: any = {}) {
  //             const components = component.components
  //             assets.componentList = assets.componentList?.concat(component.componentList || [])
  //             if (Array.isArray(components)) {
  //               components.forEach(d => {
  //                 assets.components = assets.components.concat(
  //                   {
  //                     npm: {
  //                       ...npm,
  //                       ...extraNpmInfo,
  //                     },
  //                     ...d,
  //                   } || [],
  //                 )
  //               })
  //               return
  //             }
  //             if (component.components) {
  //               assets.components = assets.components.concat(
  //                 {
  //                   npm: {
  //                     ...npm,
  //                     ...extraNpmInfo,
  //                   },
  //                   ...component.components,
  //                 } || [],
  //               )
  //             }
  //           }
  //           function setArrayAssets(value: any[], preExportName = '', preSubName = '') {
  //             value.forEach((d: any, i: number) => {
  //               const exportName = [preExportName, i.toString()].filter(d => !!d).join('.')
  //               const subName = [preSubName, i.toString()].filter(d => !!d).join('.')
  //               Array.isArray(d)
  //                 ? setArrayAssets(d, exportName, subName)
  //                 : setAssetsComponent(d, {
  //                     exportName,
  //                     subName,
  //                   })
  //             })
  //           }
  //           if ((window as any)[exportName]) {
  //             if (Array.isArray((window as any)[exportName])) {
  //               setArrayAssets((window as any)[exportName] as any)
  //             } else {
  //               setAssetsComponent((window as any)[exportName] as any)
  //             }
  //           }
  //           return (window as any)[exportName]
  //         }),
  //       )
  //     }
  //   }
  //   const innerAssets = assetsTransform(assets)
  //   this.context.set('assets', innerAssets)
  //   this.notifyGot('assets')
  // }

  @action
  onceGot<T = undefined, KeyOrType extends EditorValueKey = any>(
    keyOrType: KeyOrType,
  ): Promise<EditorGetResult<T, KeyOrType>> {
    const x = this.context.get(keyOrType)
    if (x !== undefined) {
      return Promise.resolve(x)
    }
    return new Promise(resolve => {
      this.setWait(keyOrType, resolve, true)
    })
  }

  onGot<T = undefined, KeyOrType extends EditorValueKey = any>(
    keyOrType: KeyOrType,
    fn: (data: EditorGetResult<T, KeyOrType>) => void,
  ): () => void {
    const x = this.context.get(keyOrType)
    if (x !== undefined) {
      fn(x)
    }
    this.setWait(keyOrType, fn)
    return () => {
      this.delWait(keyOrType, fn)
    }
  }

  onChange<T = undefined, KeyOrType extends EditorValueKey = any>(
    keyOrType: KeyOrType,
    fn: (data: EditorGetResult<T, KeyOrType>) => void,
  ): () => void {
    this.setWait(keyOrType, fn)
    return () => {
      this.delWait(keyOrType, fn)
    }
  }

  register(data: any, key?: EditorValueKey): void {
    this.context.set(key || data, data)
    this.notifyGot(key || data)
  }

  // async init(config?: EditorConfig, components?: PluginClassSet): Promise<any> {
  async init(config?: EditorConfig): Promise<any> {
    this.config = config || {}
    // this.components = components || {}
    const { hooks = [], lifeCycles } = this.config

    this.eventBus.emit('editor.beforeInit')
    const init = (lifeCycles && lifeCycles.init) || ((): void => {})

    try {
      await init(this)
      // 注册快捷键
      this.eventBus.emit('editor.afterInit')

      // return true
    } catch (err) {
      console.error(err)
    }

    // mount
    const setterManager = new SetterManager()
    const componentMetaManager = new ComponentMetaManager(this)
    const designer = new Designer({ editor: this, setterManager, componentMetaManager })
    const project = designer.project

    this.set('setterManager', setterManager)
    this.set('componentMetaManager', componentMetaManager)
    this.set('designer', designer)
    this.set('project', project)

    // TODO: designer.simulatorProps
    const simulator = new Simulator(project, designer)
    this.set('simulator', simulator)

    const pluginContextApiAssembler: PluginContextApiAssembler = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      assembleApis: (context, pluginName, meta) => {
        // context.hotkey = hotkey
        // context.project = project
        // context.skeleton = new Skeleton(innerSkeleton, pluginName, false)
        // context.setters = setters
        // context.material = material
        // const eventPrefix = meta?.eventPrefix || 'common'
        // context.event = new Event(commonEvent, { prefix: eventPrefix })
        // context.config = config
        // context.common = common
        // context.canvas = canvas
        // context.plugins = plugins
        // context.logger = new Logger({ level: 'warn', bizName: `plugin:${pluginName}` })
        // context.workspace = workspace
        // context.registerLevel = IPublicEnumPluginRegisterLevel.Default
        // context.isPluginRegisteredInWorkspace = false
      },
    }

    const pluginManager = new PluginManager(pluginContextApiAssembler)
    this.set('pluginManager', pluginManager)
  }

  destroy(): void {
    if (!this.config) {
      return
    }
    try {
      const { lifeCycles = {} } = this.config

      if (lifeCycles.destroy) {
        lifeCycles.destroy(this)
      }
    } catch (err) {
      console.warn(err)
    }
  }

  private notifyGot(key: EditorValueKey) {
    let waits = this.waits.get(key)
    if (!waits) {
      return
    }
    waits = waits.slice().reverse()
    let i = waits.length
    while (i--) {
      waits[i].resolve(this.get(key))
      if (waits[i].once) {
        waits.splice(i, 1)
      }
    }
    if (waits.length > 0) {
      this.waits.set(key, waits)
    } else {
      this.waits.delete(key)
    }
  }

  private setWait(key: EditorValueKey, resolve: (data: any) => void, once?: boolean) {
    const waits = this.waits.get(key)
    if (waits) {
      waits.push({ resolve, once })
    } else {
      this.waits.set(key, [{ resolve, once }])
    }
  }

  private delWait(key: EditorValueKey, fn: any) {
    const waits = this.waits.get(key)
    if (!waits) {
      return
    }
    let i = waits.length
    while (i--) {
      if (waits[i].resolve === fn) {
        waits.splice(i, 1)
      }
    }
    if (waits.length < 1) {
      this.waits.delete(key)
    }
  }
}

export const createEasyEditor = () => {
  return new Editor()
}
