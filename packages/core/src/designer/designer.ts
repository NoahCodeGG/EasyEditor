import { Project, type ProjectSchema } from '../project'

import { type Node, insertChildren, isNodeSchema } from '../document'
import type { Editor } from '../editor'
import type { ComponentMetaManager } from '../meta'
import { createEventBus, createLogger } from '../utils'
import { Detecting } from './detecting'
import { Dragon, isDragNodeDataObject, isDragNodeObject } from './dragon'
import type { LocationData } from './location'
import { DropLocation, isLocationChildrenDetail } from './location'
import { Selection } from './selection'

export interface DesignerProps {
  editor: Editor
  defaultSchema?: ProjectSchema
  // onDragstart?: (e: IPublicModelLocateEvent) => void
  // onDrag?: (e: IPublicModelLocateEvent) => void
  // onDragend?: (e: { dragObject: IPublicModelDragObject; copy: boolean }, loc?: DropLocation) => void

  [key: string]: any
}

export enum DESIGNER_EVENT {
  INIT = 'designer:init',
  DRAG_START = 'designer:dragstart',
  DRAG = 'designer:drag',
  DRAG_END = 'designer:dragend',
  DROP_LOCATION_CHANGE = 'designer:dropLocation.change',
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

  private props?: DesignerProps

  constructor(props: DesignerProps) {
    this.setProps(props)
    this.editor = props.editor
    this.project = new Project(this, props?.defaultSchema)
    this.dragon = new Dragon(this)
    this.detecting = new Detecting(this)
    this.selection = new Selection(this)

    this.dragon.onDragstart(e => {
      this.detecting.enable = false
      const { dragObject } = e
      if (isDragNodeObject(dragObject)) {
        if (dragObject.nodes.length === 1) {
          if (dragObject.nodes[0].parent) {
            // ensure current selecting
            dragObject.nodes[0].select()
          } else {
            this.selection.clear()
          }
        }
      } else {
        this.selection.clear()
      }
      if (this.props?.onDragstart) {
        this.props.onDragstart(e)
      }
      this.postEvent(DESIGNER_EVENT.DRAG_START, e)
    })

    this.dragon.onDrag(e => {
      if (this.props?.onDrag) {
        this.props.onDrag(e)
      }
      this.postEvent(DESIGNER_EVENT.DRAG, e)
    })

    // insert node
    this.dragon.onDragend(e => {
      const { dragObject, copy } = e
      this.logger.log('onDragend: dragObject ', dragObject, ' copy ', copy)
      const loc = this._dropLocation
      if (loc) {
        if (isLocationChildrenDetail(loc.detail) && loc.detail.valid !== false) {
          let nodes: Node[] | undefined
          if (isDragNodeObject(dragObject)) {
            nodes = insertChildren(loc.target, [...dragObject.nodes], loc.detail.index, copy)
          } else if (isDragNodeDataObject(dragObject)) {
            // process nodeData
            const nodeData = Array.isArray(dragObject.data) ? dragObject.data : [dragObject.data]
            const isNotNodeSchema = nodeData.find(item => !isNodeSchema(item))
            if (isNotNodeSchema) {
              return
            }
            // TODO: 这个位置操作看看能否添加到插件中
            nodeData.forEach(item => {
              item.$position = {
                x: loc.event.canvasX,
                y: loc.event.canvasY,
              }
            })
            nodes = insertChildren(loc.target, nodeData, loc.detail.index)
          }
          if (nodes) {
            this.selection.selectAll(nodes.map(o => o.id))
          }
        }
      }
      if (this.props?.onDragend) {
        this.props.onDragend(e, loc)
      }
      this.detecting.enable = true
      this.postEvent(DESIGNER_EVENT.DRAG_END, e)
    })

    // select root node
    this.project.onCurrentDocumentChange(() => {
      this.selection.clear()

      if (this.selection && this.selection.selected.length === 0) {
        const rootNode = this.project.currentDocument?.getRoot()
        if (rootNode) {
          this.selection.select(rootNode.id)
        }
      }
    })
    this.postEvent(DESIGNER_EVENT.INIT, this)
  }

  setProps(nextProps: DesignerProps) {
    const props = this.props ? { ...this.props, ...nextProps } : nextProps
    this.props = props
  }

  get(key: string) {
    return this.props?.[key]
  }

  postEvent(event: string, ...args: any[]) {
    this.emitter.emit(`designer:${event}`, ...args)
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(`designer:${event}`, listener)

    return () => {
      this.emitter.off(`designer:${event}`, listener)
    }
  }

  createLocation(locationData: LocationData<Node>): DropLocation {
    const loc = new DropLocation(locationData)
    this._dropLocation = loc
    this.postEvent(DESIGNER_EVENT.DROP_LOCATION_CHANGE, loc)
    return loc
  }

  clearLocation() {
    this._dropLocation = undefined
    this.postEvent(DESIGNER_EVENT.DROP_LOCATION_CHANGE, undefined)
  }

  onInit(listener: (designer: Designer) => void) {
    this.onEvent(DESIGNER_EVENT.INIT, listener)
  }
}
