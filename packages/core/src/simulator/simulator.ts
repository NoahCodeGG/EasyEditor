import type { IReactionDisposer, IReactionOptions, IReactionPublic } from 'mobx'
import type {
  CanvasPoint,
  Designer,
  LocateEvent,
  LocationChildrenDetail,
  LocationData,
  NodeInstance,
  Rect,
} from '../designer'
import type { Node } from '../document'
import type { Component, ComponentInstance } from '../meta'
import type { Project } from '../project'
import type { SimulatorRenderer } from './simulator-render'

import { action, autorun, computed, observable, reaction } from 'mobx'
import { DragObjectType, LocationDetailType, clipboard, isLocationData, isShaken } from '../designer'
import { getClosestClickableNode } from '../document'
import { createEventBus } from '../utils'
import Viewport from './viewport'

export type DesignMode = 'design' | 'preview' | 'live'

export interface SimulatorProps {
  // 从 documentModel 上获取
  // suspended?: boolean;
  designMode?: DesignMode
  // device?: 'mobile' | 'iphone' | string;
  // deviceClassName?: string;
  // environment?: Asset;
  // // @TODO 补充类型
  // /** @property 请求处理器配置 */
  // requestHandlersMap?: any;
  // extraEnvironment?: Asset;
  // library?: LibraryItem[];
  // utilsMetadata?: UtilsMetadata;
  // simulatorUrl?: Asset;
  // theme?: Asset;
  // componentsAsset?: Asset;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: any
}

export class Simulator {
  readonly emitter = createEventBus('Simulator')

  isSimulator = true

  readonly project: Project

  readonly designer: Designer

  readonly viewport = new Viewport()

  private _iframe?: HTMLElement

  autoRender = true

  @computed get designMode(): DesignMode {
    return this.get('designMode') || 'design'
  }

  @observable.ref accessor _props: SimulatorProps = {}

  @observable.ref private accessor _contentWindow: Window | undefined

  get contentWindow() {
    return this._contentWindow
  }

  @observable.ref private accessor _contentDocument: Document | undefined

  get contentDocument() {
    return this._contentDocument
  }

  @observable.ref private accessor _components: Record<string, Component> = {}

  /**
   * material to component map
   */
  @computed get components() {
    return this._components
  }

  @observable private accessor instancesMap: {
    [docId: string]: Map<string, ComponentInstance>
  } = {}

  private _sensorAvailable = true

  get sensorAvailable(): boolean {
    return this._sensorAvailable
  }

  // TODO
  private _renderer?: SimulatorRenderer

  get renderer() {
    return this._renderer
  }

  private sensing = false

  constructor(designer: Designer) {
    this.designer = designer
    this.project = designer.project
  }

  setProps(props: SimulatorProps) {
    this._props = props
  }

  set(key: string, value: any) {
    this._props[key] = value
  }

  get(key: string): any {
    return this._props[key]
  }

  reaction(
    expression: (reaction: IReactionPublic) => unknown,
    effect: (value: unknown, prev: unknown, reaction: IReactionPublic) => void,
    opts?: IReactionOptions<unknown, boolean>,
  ): IReactionDisposer {
    return reaction(expression, effect, opts)
  }

  autorun(
    effect: (reaction: IReactionPublic) => void,
    options?: IReactionOptions<unknown, boolean>,
  ): IReactionDisposer {
    return autorun(effect, options)
  }

  purge() {
    this._components = {}
    this._renderer = undefined
    this._contentDocument = undefined
    this._contentWindow = undefined

    for (const docId in this.instancesMap) {
      this.instancesMap[docId].clear()
    }
    this.instancesMap = {}
  }

  /**
   * mount the viewport element
   */
  mountViewport(viewport: HTMLElement) {
    this._iframe = viewport
    this._contentDocument = viewport.ownerDocument
    this._contentWindow = viewport.ownerDocument.defaultView!
    this.viewport.mount(viewport)
  }

  /**
   * force to rerender the viewport
   */
  rerender() {
    return this._renderer?.rerender()
  }

  getComponent(componentName: string) {
    return this._components[componentName]
  }

  postEvent(eventName: string, ...data: any[]) {
    this.emitter.emit(eventName, ...data)
  }

  setupEvents() {
    this.setupDragAndClick()
    this.setupDetecting()

    clipboard.injectCopyPaster(this._contentDocument!)
  }

  // TODO
  setupDragAndClick() {
    const { designer } = this
    const doc = this.contentDocument!

    // TODO: think of lock when edit a node
    // 事件路由
    doc.addEventListener(
      'mousedown',
      (downEvent: MouseEvent) => {
        const documentModel = this.project.currentDocument
        if (!documentModel) {
          return
        }
        const { selection } = this.designer
        let isMulti = false
        if (this.designMode === 'design') {
          isMulti = downEvent.metaKey || downEvent.ctrlKey
        } else if (!downEvent.metaKey) {
          return
        }
        const nodeInst = this.getNodeInstanceFromElement(downEvent.target as Element)
        const { rootNode } = documentModel
        const node = getClosestClickableNode(nodeInst?.node || rootNode, downEvent)
        // 如果找不到可点击的节点，直接返回
        if (!node) {
          return
        }
        // stop response document focus event
        downEvent.stopPropagation()
        downEvent.preventDefault()
        const isLeftButton = downEvent.which === 1 || downEvent.button === 0
        const checkSelect = (e: MouseEvent) => {
          doc.removeEventListener('mouseup', checkSelect, true)
          // 鼠标是否移动 ? - 鼠标抖动应该也需要支持选中事件，偶尔点击不能选中，磁帖块移除 shaken 检测
          if (!isShaken(downEvent, e)) {
            const { id } = node
            if (isMulti && rootNode && !node.contains(rootNode) && selection.has(id)) {
              selection.remove(id)
            } else {
              if (rootNode) {
                selection.select(node.contains(rootNode) ? rootNode.id : id)
              }

              // dirty code should refector
              const editor = this.designer?.editor
              const selected = node?.componentMeta?.componentName || ''
              editor?.eventBus.emit('designer.builtinSimulator.select', {
                selected,
              })
            }
          }
        }

        if (isLeftButton && rootNode && !node.contains(rootNode)) {
          let nodes: Node[] = [node]
          let ignoreUpSelected = false
          if (isMulti) {
            // multi select mode, directily add
            if (!selection.has(node.id)) {
              selection.add(node.id)
              ignoreUpSelected = true
            }
            rootNode?.id && selection.remove(rootNode.id)
            // 获得顶层 nodes
            nodes = selection.getTopNodes()
          } else if (selection.containsNode(node, true)) {
            nodes = selection.getTopNodes()
          } else {
            // will clear current selection & select dragment in dragstart
          }
          designer.dragon.boost(
            {
              type: DragObjectType.Node,
              nodes,
            },
            downEvent,
          )
          if (ignoreUpSelected) {
            // multi select mode has add selected, should return
            return
          }
        }

        doc.addEventListener('mouseup', checkSelect, true)
      },
      true,
    )
  }

  setupDetecting() {
    const doc = this.contentDocument!
    const { detecting, dragon } = this.designer
    const hover = (e: MouseEvent) => {
      if (!detecting.enable || this.designMode !== 'design') {
        return
      }
      const nodeInstance = this.getNodeInstanceFromElement(e.target as Element)
      if (nodeInstance?.node) {
        const { node } = nodeInstance
        detecting.capture(node)
      } else {
        detecting.capture(null)
      }
      if (dragon.dragging) {
        e.stopPropagation()
      }
    }
    const leave = () => {
      this.project.currentDocument && detecting.leave(this.project.currentDocument)
    }

    doc.addEventListener('mouseover', hover, true)
    doc.addEventListener('mouseleave', leave, false)

    // TODO: refactor this line, contains click, mousedown, mousemove
    doc.addEventListener(
      'mousemove',
      (e: Event) => {
        if (dragon.dragging) {
          e.stopPropagation()
        }
      },
      true,
    )

    // this.disableDetecting = () => {
    //   detecting.leave(this.project.currentDocument);
    //   doc.removeEventListener('mouseover', hover, true);
    //   doc.removeEventListener('mouseleave', leave, false);
    //   this.disableDetecting = undefined;
    // };
  }

  @action
  setComponents(components: Record<string, Component>) {
    this._components = components
  }

  setInstance(docId: string, id: string, instance: ComponentInstance | null) {
    if (!Object.prototype.hasOwnProperty.call(this.instancesMap, docId)) {
      this.instancesMap[docId] = new Map()
    }
    if (instance == null) {
      this.instancesMap[docId].delete(id)
    } else {
      this.instancesMap[docId].set(id, instance)
    }
  }

  getComponentInstances(node: Node) {
    const docId = node.document.id
    if (!docId) {
      return null
    }

    return this.instancesMap[docId]?.get(node.id) || null
  }

  getNodeInstanceFromElement(target: Element | null): NodeInstance<ComponentInstance, Node> | null {
    if (!target) {
      return null
    }

    // TODO: 想办法从 target 身上获取到 docId
    const docId = this.project.currentDocument!.id
    const nodeId = target.id

    return {
      docId,
      nodeId,
      instance: target,
      node: this.project.getDocument(docId)?.getNode(nodeId) || null,
    }
  }

  /**
   * compute the rect of node's instance
   */
  computeRect(node: Node) {
    const instance = this.getComponentInstances(node)
    if (!instance) {
      return null
    }
    return this.computeComponentInstanceRect(instance)
  }

  computeComponentInstanceRect(instance: ComponentInstance) {
    return instance.getBoundingClientRect()
  }

  /**
   * fix event's prop, canvasX、canvasY and target
   */
  fixEvent(e: LocateEvent): LocateEvent {
    if (e.fixed) {
      return e
    }

    const notMyEvent = e.originalEvent.view?.document !== this.contentDocument
    // fix canvasX canvasY
    if (notMyEvent || !('canvasX' in e) || !('canvasY' in e)) {
      const l = this.viewport.toLocalPoint({
        clientX: e.globalX,
        clientY: e.globalY,
      })
      e.canvasX = l.clientX
      e.canvasY = l.clientY
    }

    // fix target
    if (!e.target || notMyEvent) {
      if (!Number.isNaN(e.canvasX!) && !Number.isNaN(e.canvasY!)) {
        e.target = this.contentDocument?.elementFromPoint(e.canvasX!, e.canvasY!)
      }
    }

    e.fixed = true
    return e
  }

  /**
   * check the rect whether is in the viewport
   */
  isEnter(e: LocateEvent) {
    const rect = this.viewport.bounds
    return e.globalY >= rect.top && e.globalY <= rect.bottom && e.globalX >= rect.left && e.globalX <= rect.right
  }

  deactiveSensor() {
    this.sensing = false
  }

  // TODO
  locate(e: LocateEvent): any {
    const { dragObject } = e

    const nodes = dragObject?.nodes
    // Calculate the nodes that can be moved
    const operationalNodes = nodes?.filter(node => {
      const onMoveHook = node?.componentMeta?.advanced?.callbacks?.onMoveHook
      const canMove = onMoveHook && typeof onMoveHook === 'function' ? onMoveHook(node) : true

      const parentNode = node?.parent
      const onChildMoveHook = parentNode?.componentMeta?.advanced?.callbacks?.onChildMoveHook
      const childrenCanMove =
        onChildMoveHook && parentNode && typeof onChildMoveHook === 'function'
          ? onChildMoveHook(node, parentNode)
          : true

      return canMove && childrenCanMove
    })

    if (nodes && (!operationalNodes || operationalNodes.length === 0)) {
      return
    }

    this.sensing = true
    const document = this.project.currentDocument
    if (!document) {
      return null
    }
    // const dropContainer = this.getDropContainer(e)
    // TODO: 暂时只支持 rootNode
    const dropContainer = {
      container: document.rootNode,
      instance: this.getComponentInstances(document.rootNode!)!,
    }
    if (!dropContainer) {
      return null
    }

    if (isLocationData(dropContainer)) {
      return this.designer.createLocation(dropContainer)
    }

    const { container, instance: containerInstance } = dropContainer

    const edge = this.computeComponentInstanceRect(containerInstance)

    if (!edge) {
      return null
    }

    const { children } = container!

    const detail: LocationChildrenDetail = {
      type: LocationDetailType.Children,
      index: 0,
      edge,
    }

    const locationData: LocationData<Node> = {
      target: container!,
      detail,
      source: `simulator${document.id}`,
      event: e,
    }

    if (e.dragObject && e.dragObject.nodes && e.dragObject.nodes.length) {
      return this.designer.createLocation({
        target: document.rootNode!,
        detail,
        source: `simulator${document.id}`,
        event: e,
      })
    }

    if (!children || children.size < 1 || !edge) {
      return this.designer.createLocation(locationData)
    }

    return this.designer.createLocation(locationData)
  }
}

export const isSimulator = (obj: any): obj is Simulator => {
  return obj && obj.isSimulator
}

const isPointInRect = (point: CanvasPoint, rect: Rect) => {
  return (
    point.canvasY >= rect.top &&
    point.canvasY <= rect.bottom &&
    point.canvasX >= rect.left &&
    point.canvasX <= rect.right
  )
}

const distanceToRect = (point: CanvasPoint, rect: Rect) => {
  let minX = Math.min(Math.abs(point.canvasX - rect.left), Math.abs(point.canvasX - rect.right))
  let minY = Math.min(Math.abs(point.canvasY - rect.top), Math.abs(point.canvasY - rect.bottom))
  if (point.canvasX >= rect.left && point.canvasX <= rect.right) {
    minX = 0
  }
  if (point.canvasY >= rect.top && point.canvasY <= rect.bottom) {
    minY = 0
  }

  return Math.sqrt(minX ** 2 + minY ** 2)
}
