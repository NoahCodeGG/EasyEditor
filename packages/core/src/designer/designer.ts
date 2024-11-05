import { Project, type ProjectSchema } from '@/project'

import type { Document } from '@/document'
import type { Editor } from '@/editor'
import type { ComponentMetaManager, ComponentType } from '@/meta'
import { createEventBus, createLogger } from '@/utils'
import { computed, observable } from 'mobx'
import { Detecting } from './detecting'
import { Dragon } from './dragon'
import type { LocationData } from './location'
import { DropLocation } from './location'
import { Selection } from './selection'

export interface DesignerProps {
  [key: string]: any
  editor: Editor
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

  readonly editor: Editor

  readonly dragon: Dragon

  readonly detecting: Detecting

  readonly project: Project

  readonly selection: Selection

  private _dropLocation?: DropLocation

  get componentMetaManager() {
    return this.editor.get('componentMetaManager') as ComponentMetaManager
  }

  @observable.ref private _simulatorComponent?: ComponentType<any>

  @observable.ref private _simulatorProps?: Record<string, any> | ((project: Project) => object)

  // @observable private _suspensed = false

  private props?: DesignerProps

  constructor(props: DesignerProps) {
    this.setProps(props)
    this.editor = props.editor
    this.project = new Project(this, props?.defaultSchema)
    this.dragon = new Dragon(this)
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
        // this.buildComponentMetasMap(props.componentMetadatas)
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
        // this.buildComponentMetasMap(props.componentMetadatas)
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

  postEvent(event: string, ...args: any[]) {
    this.emitter.emit(`designer:${event}`, ...args)
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(`designer:${event}`, listener)
  }

  offEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.off(`designer:${event}`, listener)
  }

  createLocation(locationData: LocationData<Node>): DropLocation {
    const loc = new DropLocation(locationData)
    if (this._dropLocation && this._dropLocation.document && this._dropLocation.document !== loc.document) {
      this._dropLocation.document.dropLocation = null
    }
    this._dropLocation = loc
    this.postEvent('dropLocation.change', loc)
    if (loc.document) {
      loc.document.dropLocation = loc
    }
    // this.activeTracker.track({ node: loc.target, detail: loc.detail });
    return loc
  }

  /**
   * 清除插入位置
   */
  clearLocation() {
    if (this._dropLocation && this._dropLocation.document) {
      this._dropLocation.document.dropLocation = null
    }
    this.postEvent('dropLocation.change', undefined)
    this._dropLocation = undefined
  }
}
