import type { Component, ComponentMetadata } from './designer'
import type { Plugin, PluginContextApiAssembler } from './plugin'
import type { Setter } from './setter-manager'
import type { Assets, ComponentDescription, ProjectSchema, RemoteComponentDescription } from './types'

import { action, observable } from 'mobx'
import { ComponentMetaManager, Designer, type DesignerProps } from './designer'
import { PluginManager } from './plugin'
import { SetterManager } from './setter-manager'
import { Simulator } from './simulator'
import { AssetLoader, Hotkey, type HotkeyConfig, createEventBus, createLogger, logger } from './utils'

const AssetsCache: {
  [key: string]: RemoteComponentDescription
} = {}

export type EditorValueKey = string | symbol

export type EditorGetResult<T, ClsType> = T extends undefined
  ? ClsType extends {
      prototype: infer R
    }
    ? R
    : any
  : T

export interface EditorConfig {
  /**
   * 插件 Plugin
   */
  plugins?: Plugin[]

  /**
   * 设置器 Setter
   */
  setters?: Record<string, Component | Setter>

  /**
   * 组件 Component
   */
  components?: Record<string, Component>

  /**
   * 组件元数据 ComponentMetadata
   */
  componentMetas?: Record<string, ComponentMetadata>

  /**
   * 生命周期
   */
  lifeCycles?: LifeCyclesConfig

  /**
   * designer props
   */
  designer?: Pick<DesignerProps, 'onDragstart' | 'onDrag' | 'onDragend'>

  /**
   * 默认项目 Schema
   */
  defaultSchema?: ProjectSchema

  /**
   * 快捷键
   */
  hotkeys?: HotkeyConfig[]
}

export interface LifeCyclesConfig {
  init?: (editor: Editor) => any
  destroy?: (editor: Editor) => any
  extend?: (editor: Editor) => any
}

export enum EDITOR_EVENT {
  BEFORE_INIT = 'editor:beforeInit',
  AFTER_INIT = 'editor:afterInit',
  DESTROY = 'editor:destroy',
  BEFORE_EXTEND = 'editor:beforeExtend',
  AFTER_EXTEND = 'editor:afterExtend',
}

export class Editor {
  @observable.shallow private accessor context = new Map<EditorValueKey, any>()

  config?: EditorConfig

  eventBus = createEventBus('EasyEditor')

  private waits = new Map<
    EditorValueKey,
    Array<{
      once?: boolean
      resolve: (data: any) => void
    }>
  >()

  constructor(config?: EditorConfig) {
    if (config) {
      this.init(config)
    }
  }

  get<T = undefined, KeyOrType extends EditorValueKey = any>(
    keyOrType: KeyOrType,
  ): EditorGetResult<T, KeyOrType> | undefined {
    return this.context.get(keyOrType)
  }

  has(keyOrType: EditorValueKey): boolean {
    return this.context.has(keyOrType)
  }

  @action
  set(key: EditorValueKey, data: any): void | Promise<void> {
    if (key === 'assets') {
      return this.setAssets(data)
    }

    this.context.set(key, data)
    this.notifyGot(key)
  }

  @action
  async setAssets(assets: Assets) {
    const { components, packages } = assets

    if (packages) {
      const simulator = await this.onceGot<Simulator>('simulator')
      if (simulator) {
        await simulator.setupComponents(packages)
      }
    }

    if (components && components.length) {
      const componentDescriptions: ComponentDescription[] = []
      const remoteComponentDescriptions: RemoteComponentDescription[] = []
      components.forEach((component: any) => {
        if (!component) {
          return
        }
        if (component.exportName && component.url) {
          remoteComponentDescriptions.push(component)
        } else {
          componentDescriptions.push(component)
        }
      })
      assets.components = componentDescriptions
      assets.componentList = assets.componentList || []

      // 如果有远程组件描述协议，则自动加载并补充到资产包中，同时出发 designer.incrementalAssetsReady 通知组件面板更新数据
      if (remoteComponentDescriptions && remoteComponentDescriptions.length) {
        await Promise.all(
          remoteComponentDescriptions.map(async (component: RemoteComponentDescription) => {
            const { exportName, url, npm } = component
            if (!url || !exportName) {
              return
            }
            if (!AssetsCache[exportName] || !npm?.version || AssetsCache[exportName].npm?.version !== npm?.version) {
              await new AssetLoader().load(url)
            }
            AssetsCache[exportName] = component
            function setAssetsComponent(component: any, extraNpmInfo: any = {}) {
              const components = component.components
              assets.componentList = assets.componentList?.concat(component.componentList || [])
              if (Array.isArray(components)) {
                components.forEach(d => {
                  assets.components = assets.components.concat({
                    npm: {
                      ...npm,
                      ...extraNpmInfo,
                    },
                    ...d,
                  })
                })
                return
              }
              if (component.components) {
                assets.components = assets.components.concat({
                  npm: {
                    ...npm,
                    ...extraNpmInfo,
                  },
                  ...component.components,
                })
              }
            }
            function setArrayAssets(value: any[], preExportName = '', preSubName = '') {
              value.forEach((d: any, i: number) => {
                const exportName = [preExportName, i.toString()].filter(d => !!d).join('.')
                const subName = [preSubName, i.toString()].filter(d => !!d).join('.')
                Array.isArray(d)
                  ? setArrayAssets(d, exportName, subName)
                  : setAssetsComponent(d, {
                      exportName,
                      subName,
                    })
              })
            }
            if ((window as any)[exportName]) {
              if (Array.isArray((window as any)[exportName])) {
                setArrayAssets((window as any)[exportName] as any)
              } else {
                setAssetsComponent((window as any)[exportName] as any)
              }
            }
            return (window as any)[exportName]
          }),
        )
      }
    }
    this.context.set('assets', assets)
    this.notifyGot('assets')
  }

  /**
   * get value until value is set
   */
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

  /**
   * listen value when value is set
   */
  @action
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

  /**
   * listen value when value is changed
   */
  onChange<T = undefined, KeyOrType extends EditorValueKey = any>(
    keyOrType: KeyOrType,
    fn: (data: EditorGetResult<T, KeyOrType>) => void,
  ): () => void {
    this.setWait(keyOrType, fn)
    return () => {
      this.delWait(keyOrType, fn)
    }
  }

  async init(config?: EditorConfig) {
    this.config = config || {}
    const {
      lifeCycles,
      plugins,
      setters,
      components,
      componentMetas,
      hotkeys,
      designer: designerProps,
      defaultSchema,
    } = this.config

    // 1. register plugins
    const pluginManager = new PluginManager()
    if (plugins) {
      pluginManager.registerPlugins(plugins)
    }

    // 2. plugins.extend()
    await this.extend(pluginManager)

    // 3. init
    this.eventBus.emit(EDITOR_EVENT.BEFORE_INIT)

    const hotkey = new Hotkey()
    const setterManager = new SetterManager()
    const componentMetaManager = new ComponentMetaManager(this)
    const designer = new Designer({
      editor: this,
      setterManager,
      componentMetaManager,
      ...designerProps,
      defaultSchema,
    })
    const project = designer.project
    const simulator = new Simulator(designer)
    project.mountSimulator(simulator)

    // pluginEvent is a unified eventBus for all plugins
    const pluginEvent = createEventBus('plugin')
    const contextApiAssembler: PluginContextApiAssembler = {
      assembleApis: (context, pluginName, meta) => {
        context.editor = this
        context.simulator = simulator
        context.designer = designer
        context.project = project
        context.setterManager = setterManager
        context.componentMetaManager = componentMetaManager
        context.event = pluginEvent
        context.hotkey = hotkey
        context.logger = createLogger(`plugin:${pluginName}`)
      },
    }
    pluginManager.setContextApiAssembler(contextApiAssembler)

    this.set('setterManager', setterManager)
    this.set('componentMetaManager', componentMetaManager)
    this.set('designer', designer)
    this.set('project', project)
    this.set('simulator', simulator)
    this.set('pluginManager', pluginManager)

    if (setters) {
      setterManager.buildSettersMap(setters)
    }
    if (components) {
      simulator.buildComponentMap(components)
    }
    if (componentMetas) {
      componentMetaManager.buildComponentMetasMap(componentMetas)
    }
    if (hotkeys) {
      hotkey.batchBind(hotkeys)
    }

    try {
      await pluginManager.init()
      await lifeCycles?.init?.(this)
    } catch (err) {
      logger.error(err)
    }

    this.eventBus.emit(EDITOR_EVENT.AFTER_INIT)
  }

  destroy() {
    if (!this.config) {
      return
    }

    try {
      const { lifeCycles = {} } = this.config
      lifeCycles?.destroy?.(this)
    } catch (err) {
      logger.warn(err)
    }

    this.eventBus.emit(EDITOR_EVENT.DESTROY)
  }

  async extend(pluginManager: PluginManager) {
    this.eventBus.emit(EDITOR_EVENT.BEFORE_EXTEND)

    try {
      const { lifeCycles = {} } = this.config!
      lifeCycles?.extend?.(this)
      await pluginManager.extend()
    } catch (err) {
      logger.warn(err)
    }

    this.eventBus.emit(EDITOR_EVENT.AFTER_EXTEND)
  }

  /**
   * notify all listeners when value is got
   */
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

  onBeforeInit(listener: (editor: Editor) => void) {
    this.eventBus.on(EDITOR_EVENT.BEFORE_INIT, listener)

    return () => {
      this.eventBus.off(EDITOR_EVENT.BEFORE_INIT, listener)
    }
  }

  onAfterInit(listener: (editor: Editor) => void) {
    this.eventBus.on(EDITOR_EVENT.AFTER_INIT, listener)

    return () => {
      this.eventBus.off(EDITOR_EVENT.AFTER_INIT, listener)
    }
  }

  onDestroy(listener: (editor: Editor) => void) {
    this.eventBus.on(EDITOR_EVENT.DESTROY, listener)

    return () => {
      this.eventBus.off(EDITOR_EVENT.DESTROY, listener)
    }
  }

  onBeforeExtend(listener: (editor: Editor) => void) {
    this.eventBus.on(EDITOR_EVENT.BEFORE_EXTEND, listener)

    return () => {
      this.eventBus.off(EDITOR_EVENT.BEFORE_EXTEND, listener)
    }
  }

  onAfterExtend(listener: (editor: Editor) => void) {
    this.eventBus.on(EDITOR_EVENT.AFTER_EXTEND, listener)

    return () => {
      this.eventBus.off(EDITOR_EVENT.AFTER_EXTEND, listener)
    }
  }
}

export const createEasyEditor = (config?: EditorConfig) => {
  return new Editor(config)
}
