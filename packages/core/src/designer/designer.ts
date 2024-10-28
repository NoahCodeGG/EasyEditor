import { Project, type ProjectSchema } from '@/project'

import type { Document } from '@/document'
import { createEventBus, createLogger } from '@/utils'
import { computed, observable } from 'mobx'
import { Detecting } from './detecting'
import { Dragon } from './dragon'
import { Selection } from './selection'

// export type ComponentType<T> = React.ComponentType<T>
export type ComponentType<T> = any

export type Component = ComponentType<any> | object

// TODO
export interface ComponentMeta {
  [key: string]: any
}

export interface ComponentMetadata {
  [key: string]: any
}

export interface DesignerProps {
  [key: string]: any
  defaultSchema?: ProjectSchema
  hotkeys?: object
  viewName?: string
  simulatorProps?: Record<string, any> | ((document: Document) => object)
  simulatorComponent?: ComponentType<any>
  // dragGhostComponent?: ComponentType<any>
  suspensed?: boolean
  // componentMetadatas?: IPublicTypeComponentMetadata[]
  // globalComponentActions?: IPublicTypeComponentAction[]
  onMount?: (designer: Designer) => void
  // onDragstart?: (e: IPublicModelLocateEvent) => void
  // onDrag?: (e: IPublicModelLocateEvent) => void
  // onDragend?: (e: { dragObject: IPublicModelDragObject; copy: boolean }, loc?: DropLocation) => void
}

export class Designer {
  private logger = createLogger('Designer')
  private emitter = createEventBus('Designer')

  readonly dragon: Dragon

  readonly detecting: Detecting

  readonly project: Project

  readonly selection: Selection

  @observable.ref private _componentMetasMap = new Map<string, ComponentMeta>()

  private _lostComponentMetasMap = new Map<string, ComponentMeta>()

  @observable.ref private _simulatorComponent?: ComponentType<any>

  @observable.ref private _simulatorProps?: Record<string, any> | ((project: Project) => object)

  // @observable private _suspensed = false

  private props?: DesignerProps

  constructor(props: DesignerProps) {
    this.setProps(props)
    this.project = new Project(this, props?.defaultSchema)
    this.dragon = new Dragon()
    this.detecting = new Detecting()
    this.selection = new Selection(this)

    // TODO: dragon event

    // TODO: 初始化 选 中根节点，是否需要？
  }

  setProps(nextProps: DesignerProps) {
    const props = this.props ? { ...this.props, ...nextProps } : nextProps
    if (this.props) {
      // check hotkeys
      // TODO:
      // check simulatorConfig
      if (props.simulatorComponent !== this.props.simulatorComponent) {
        this._simulatorComponent = props.simulatorComponent
      }
      if (props.simulatorProps !== this.props.simulatorProps) {
        this._simulatorProps = props.simulatorProps
        // 重新 setupSelection
        // if (props.simulatorProps?.designMode !== this.props.simulatorProps?.designMode) {
        //   this.setupSelection()
        // }
      }
      // if (props.suspensed !== this.props.suspensed && props.suspensed != null) {
      //   this._suspensed = props.suspensed
      // }
      if (props.componentMetadatas !== this.props.componentMetadatas && props.componentMetadatas != null) {
        this.buildComponentMetasMap(props.componentMetadatas)
      }
    } else {
      // init hotkeys
      // todo:
      // init simulatorConfig
      if (props.simulatorComponent) {
        this._simulatorComponent = props.simulatorComponent
      }
      if (props.simulatorProps) {
        this._simulatorProps = props.simulatorProps
      }
      // init suspensed
      // if (props.suspensed != null) {
      //   this.suspensed = props.suspensed
      // }
      if (props.componentMetadatas != null) {
        this.buildComponentMetasMap(props.componentMetadatas)
      }
    }
    this.props = props
  }

  get(key: string) {
    return this.props?.[key]
  }

  @computed get simulatorComponent(): ComponentType<any> | undefined {
    return this._simulatorComponent
  }

  @computed get simulatorProps(): Record<string, any> {
    if (typeof this._simulatorProps === 'function') {
      return this._simulatorProps(this.project)
    }
    return this._simulatorProps || {}
  }

  /**
   * provide props for simulator
   */
  @computed get projectSimulatorProps(): any {
    return {
      ...this.simulatorProps,
      project: this.project,
      designer: this,
      onMount: (simulator: any) => {
        // this.project.mountSimulator(simulator)
        // this.editor.set('simulator', simulator)
      },
    }
  }

  refreshComponentMetasMap() {
    this._componentMetasMap = new Map(this._componentMetasMap)
  }

  buildComponentMetasMap(metas: ComponentMetadata[]) {
    metas.forEach(data => this.createComponentMeta(data))
  }

  createComponentMeta(data: ComponentMetadata) {
    const key = data.componentName
    if (!key) {
      return null
    }
    let meta = this._componentMetasMap.get(key)
    if (meta) {
      meta.setMetadata(data)

      this._componentMetasMap.set(key, meta)
    } else {
      meta = this._lostComponentMetasMap.get(key)

      if (meta) {
        meta.setMetadata(data)
        this._lostComponentMetasMap.delete(key)
      } else {
        meta = new ComponentMeta(this, data)
      }

      this._componentMetasMap.set(key, meta)
    }

    return meta
  }

  getComponentMeta(componentName: string, generateMetadata?: () => ComponentMetadata | null): ComponentMeta {
    if (this._componentMetasMap.has(componentName)) {
      return this._componentMetasMap.get(componentName)!
    }

    if (this._lostComponentMetasMap.has(componentName)) {
      return this._lostComponentMetasMap.get(componentName)!
    }

    const meta = new ComponentMeta(this, {
      componentName,
      ...(generateMetadata ? generateMetadata() : null),
    })

    this._lostComponentMetasMap.set(componentName, meta)

    return meta
  }

  getComponentMetasMap() {
    return this._componentMetasMap
  }

  @computed get componentsMap(): { [key: string]: Component } {
    const maps: any = {}
    this._componentMetasMap.forEach((config, key) => {
      const metaData = config.getMetadata()
      if (metaData.devMode === 'lowCode') {
        maps[key] = metaData.schema
      } else {
        const { view } = config.advanced
        if (view) {
          maps[key] = view
        } else {
          maps[key] = config.npm
        }
      }
    })
    return maps
  }

  postEvent(event: string, ...args: any[]) {
    this.emitter.emit(`designer:${event}`, ...args)
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(`designer:${event}`, listener)
  }

  offEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.off(`designer:${event}`, listener)
  }
}
