import { action, observable } from 'mobx'
import { Designer } from './designer'
import { type Component, ComponentMetaManager, type ComponentMetadata, type Setter, SetterManager } from './meta'
import { type Plugin, type PluginContextApiAssembler, PluginManager } from './plugin'
import { Simulator } from './simulator'
import { type EventBus, createEventBus, createLogger } from './utils'

export type EditorValueKey = string | symbol

export type EditorGetResult<T, ClsType> = T extends undefined
  ? ClsType extends {
      prototype: infer R
    }
    ? R
    : any
  : T

export interface EditorConfig {
  hotkeys?: HotkeysConfig
  lifeCycles?: LifeCyclesConfig

  plugins?: Plugin[] | Array<{ plugin: Plugin; options?: any }>
  setters?: Record<string, Setter>
  components?: Record<string, Component>
  componentMetas?: Record<string, ComponentMetadata>
}
export type HotkeysConfig = HotkeyConfig[]

export interface HotkeyConfig {
  keyboard: string
  handler: (editor: Editor, ev: Event, keymaster: any) => void
}

export interface LifeCyclesConfig {
  init?: (editor: Editor) => any
  destroy?: (editor: Editor) => any
}

export enum EditorEvent {
  BEFORE_INIT = 'editor:beforeInit',
  AFTER_INIT = 'editor:afterInit',
  DESTROY = 'editor:destroy',
}

export class Editor {
  @observable.shallow private accessor context = new Map<EditorValueKey, any>()

  config?: EditorConfig

  eventBus: EventBus

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
    this.context.set(key, data)
    this.notifyGot(key)
  }

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

  async init(config?: EditorConfig) {
    this.config = config || {}
    const { lifeCycles, plugins, setters, components, componentMetas } = this.config

    this.eventBus.emit(EditorEvent.BEFORE_INIT)

    const init = (lifeCycles && lifeCycles.init) || ((): void => {})
    const setterManager = new SetterManager()
    const componentMetaManager = new ComponentMetaManager(this)
    const designer = new Designer({ editor: this, setterManager, componentMetaManager })
    const project = designer.project
    // TODO: designer.simulatorProps
    const simulator = new Simulator(project, designer)

    const pluginEvent = createEventBus('plugin')
    const pluginContextApiAssembler: PluginContextApiAssembler = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      assembleApis: (context, pluginName, meta) => {
        // context.hotkey = hotkey
        context.editor = this
        context.simulator = simulator
        context.designer = designer
        context.project = project
        context.setterManager = setterManager
        context.componentMetaManager = componentMetaManager
        context.event = pluginEvent
        context.logger = createLogger(`plugin:${pluginName}`)
      },
    }
    const pluginManager = new PluginManager(pluginContextApiAssembler)

    if (plugins) {
      pluginManager.registerPlugins(plugins)
    }
    if (setters) {
      setterManager.registerSettersMap(setters)
    }
    if (components) {
      simulator.setComponents(components)
    }
    if (componentMetas) {
      componentMetaManager.createComponentMetaMap(componentMetas)
    }

    try {
      await pluginManager.init()

      await init(this)
      // 注册快捷键

      // return true
    } catch (err) {
      console.error(err)
    }

    this.set('setterManager', setterManager)
    this.set('componentMetaManager', componentMetaManager)
    this.set('designer', designer)
    this.set('project', project)
    this.set('simulator', simulator)
    this.set('pluginManager', pluginManager)

    this.eventBus.emit(EditorEvent.AFTER_INIT)
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

  onBeforeInit(listener: (editor: Editor) => void) {
    this.eventBus.on(EditorEvent.BEFORE_INIT, listener)

    return () => {
      this.eventBus.off(EditorEvent.BEFORE_INIT, listener)
    }
  }

  onAfterInit(listener: (editor: Editor) => void) {
    this.eventBus.on(EditorEvent.AFTER_INIT, listener)

    return () => {
      this.eventBus.off(EditorEvent.AFTER_INIT, listener)
    }
  }

  onDestroy(listener: (editor: Editor) => void) {
    this.eventBus.on(EditorEvent.DESTROY, listener)

    return () => {
      this.eventBus.off(EditorEvent.DESTROY, listener)
    }
  }
}

export const createEasyEditor = () => {
  return new Editor()
}
