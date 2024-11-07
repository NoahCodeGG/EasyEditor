import {
  type IReactionDisposer,
  type IReactionOptions,
  type IReactionPublic,
  action,
  autorun,
  computed,
  observable,
  reaction,
} from 'mobx'
import {
  type CanvasPoint,
  type ComponentInstance,
  type Designer,
  DragObjectType,
  type LocateEvent,
  type LocationChildrenDetail,
  LocationDetailType,
  type NodeInstance,
  type Rect,
  clipboard,
  isLocationData,
  isShaken,
} from '../designer'
import type { Node } from '../document'
import type { Component } from '../meta'
import type { Project } from '../project'
import { createEventBus } from '../utils'
import type { SimulatorRenderer } from './simulator-render'
import Viewport from './viewport'

type DesignMode = 'live' | 'design' | 'preview'

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

  @observable.ref private accessor _contentWindow?: Window

  get contentWindow() {
    return this._contentWindow
  }

  @observable.ref private accessor _contentDocument?: Document

  get contentDocument() {
    return this._contentDocument
  }

  @observable.ref private accessor _components: Record<string, Component> = {}

  @computed get components() {
    return this._components
  }

  @observable private accessor instancesMap: {
    [docId: string]: Map<string, ComponentInstance[]>
  } = {}

  private _sensorAvailable = true

  get sensorAvailable(): boolean {
    return this._sensorAvailable
  }

  private _renderer?: SimulatorRenderer

  get renderer() {
    return this._renderer
  }

  private sensing = false

  constructor(project: Project, designer: Designer) {
    this.project = project
    this.designer = designer
  }

  setProps(props: SimulatorProps) {
    this._props = props
  }

  set(key: string, value: any) {
    this._props = {
      ...this._props,
      [key]: value,
    }
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

  purge(): void {
    // todo
  }

  mountViewport(viewport: HTMLElement) {
    this._iframe = viewport
    this._contentDocument = viewport.ownerDocument
    this._contentWindow = viewport.ownerDocument.defaultView!
    this.viewport.mount(viewport)
  }

  setupEvents() {
    this.setupDragAndClick()
    this.setupDetecting()

    clipboard.injectCopyPaster(this._contentDocument!)
  }

  postEvent(eventName: string, ...data: any[]) {
    this.emitter.emit(eventName, ...data)
  }

  setupDragAndClick() {
    const { designer } = this
    const doc = this.contentDocument!

    // TODO: think of lock when edit a node
    // 事件路由
    doc.addEventListener(
      'mousedown',
      (downEvent: MouseEvent) => {
        // fix for popups close logic
        document.dispatchEvent(new Event('mousedown'))
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
        // FIXME: dirty fix remove label-for fro liveEditing
        downEvent.target?.removeAttribute('for')
        const nodeInst = this.getNodeInstanceFromElement(downEvent.target)
        const { rootNode } = documentModel
        const node = getClosestClickableNode(nodeInst?.node || rootNode, downEvent)
        // 如果找不到可点击的节点，直接返回
        if (!node) {
          return
        }
        // stop response document focus event
        // 禁止原生拖拽
        downEvent.stopPropagation()
        downEvent.preventDefault()
        const isLeftButton = downEvent.which === 1 || downEvent.button === 0
        const checkSelect = (e: MouseEvent) => {
          doc.removeEventListener('mouseup', checkSelect, true)
          // 鼠标是否移动 ? - 鼠标抖动应该也需要支持选中事件，偶尔点击不能选中，磁帖块移除 shaken 检测
          if (!isShaken(downEvent, e)) {
            let { id } = node
            if (isMulti && rootNode && !node.contains(rootNode) && selection.has(id)) {
              selection.remove(id)
            } else {
              // TODO: 避免选中 Page 组件，默认选中第一个子节点；新增规则 或 判断 Live 模式
              if (node.isPage() && node.getChildren()?.notEmpty() && this.designMode === 'live') {
                const firstChildId = node.getChildren()?.get(0)?.getId()
                if (firstChildId) id = firstChildId
              }
              if (rootNode) {
                selection.select(node.contains(rootNode) ? rootNode.id : id)
              }

              // dirty code should refector
              const editor = this.designer?.editor
              const npm = node?.componentMeta?.npm
              const selected =
                [npm?.package, npm?.componentName].filter(item => !!item).join('-') ||
                node?.componentMeta?.componentName ||
                ''
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
      const nodeInst = this.getNodeInstanceFromElement(e.target as Element)
      if (nodeInst?.node) {
        let { node } = nodeInst
        const focusNode = node.document?.focusNode
        if (focusNode && node.contains(focusNode)) {
          node = focusNode
        }
        detecting.capture(node)
      } else {
        detecting.capture(null)
      }
      if (!engineConfig.get('enableMouseEventPropagationInCanvas', false) || dragon.dragging) {
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
        if (!engineConfig.get('enableMouseEventPropagationInCanvas', false) || dragon.dragging) {
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

  // TODO: 想想结构
  @action
  setComponents(components: Record<string, Component>) {
    this._components = components
  }

  setInstance(docId: string, id: string, instances: ComponentInstance[] | null) {
    if (!Object.prototype.hasOwnProperty.call(this.instancesMap, docId)) {
      this.instancesMap[docId] = new Map()
    }
    if (instances == null) {
      this.instancesMap[docId].delete(id)
    } else {
      this.instancesMap[docId].set(id, instances.slice())
    }
  }

  getComponentInstances(node: Node) {
    const docId = node.document?.id
    if (!docId) {
      return null
    }

    const instances = this.instancesMap[docId]?.get(node.id) || null
    return instances
  }

  getNodeInstanceFromElement(target: Element | null): NodeInstance<ComponentInstance, Node> | null {
    if (!target) {
      return null
    }

    // TODO:
    // const SYMBOL_VNID = Symbol('_LCNodeId');
    // const SYMBOL_VDID = Symbol('_LCDocId');
    const docId = this.project.currentDocument!.id
    const nodeId = target.id

    return {
      docId,
      nodeId,
      instance: target,
      node: this.project.getDocument(docId)?.getNode(nodeId) || null,
    }
  }

  findDOMNodes(instance: ComponentInstance, selector?: string) {}

  computeRect(node: Node): Rect | null {
    const instances = this.getComponentInstances(node)
    if (!instances) {
      return null
    }
    return this.computeComponentInstanceRect(instances[0])
  }

  computeComponentInstanceRect(instance: ComponentInstance) {
    return instance.getBoundingClientRect()
  }

  fixEvent(e: LocateEvent): LocateEvent {
    if (e.fixed) {
      return e
    }

    const notMyEvent = e.originalEvent.view?.document !== this.contentDocument
    // fix canvasX canvasY : 当前激活文档画布坐标系
    if (notMyEvent || !('canvasX' in e) || !('canvasY' in e)) {
      const l = this.viewport.toLocalPoint({
        clientX: e.globalX,
        clientY: e.globalY,
      })
      e.canvasX = l.clientX
      e.canvasY = l.clientY
    }

    // fix target : 浏览器事件响应目标
    if (!e.target || notMyEvent) {
      if (!Number.isNaN(e.canvasX!) && !Number.isNaN(e.canvasY!)) {
        e.target = this.contentDocument?.elementFromPoint(e.canvasX!, e.canvasY!)
      }
    }

    // 事件已订正
    e.fixed = true
    return e
  }

  isEnter(e: LocateEvent): boolean {
    const rect = this.viewport.bounds
    return e.globalY >= rect.top && e.globalY <= rect.bottom && e.globalX >= rect.left && e.globalX <= rect.right
  }

  deactiveSensor() {
    this.sensing = false
  }

  locate(e: LocateEvent): any {
    const { dragObject } = e
    const nodes = dragObject?.nodes

    const operationalNodes = nodes?.filter(node => {
      // const onMoveHook = node.componentMeta?.advanced.callbacks?.onMoveHook;
      // const canMove = onMoveHook && typeof onMoveHook === 'function' ? onMoveHook(node.internalToShellNode()) : true;
      const canMove = true

      // let parentContainerNode: Node | null = null
      // let parentNode = node?.parent

      // while (parentNode) {
      //   if (parentNode.isContainer()) {
      //     parentContainerNode = parentNode;
      //     break;
      //   }

      //   parentNode = parentNode.parent;
      // }

      // const onChildMoveHook = parentContainerNode?.componentMeta?.advanced.callbacks?.onChildMoveHook;
      // const childrenCanMove = onChildMoveHook && parentContainerNode && typeof onChildMoveHook === 'function' ? onChildMoveHook(node.internalToShellNode(), parentContainerNode.internalToShellNode()) : true;
      const childrenCanMove = true

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
    const dropContainer = this.getDropContainer(e)
    // TODO
    // const lockedNode = getClosestNode(dropContainer?.container, node => node.isLocked)
    // if (lockedNode) return null
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

    const { children } = container

    const detail: LocationChildrenDetail = {
      type: LocationDetailType.Children,
      index: 0,
      edge,
    }

    const locationData = {
      target: container,
      detail,
      source: `simulator${document.id}`,
      event: e,
    }

    // if (
    //   e.dragObject &&
    //   e.dragObject.nodes &&
    //   e.dragObject.nodes.length &&
    //   e.dragObject.nodes[0].componentMeta.isModal &&
    //   document.focusNode
    // ) {
    //   return this.designer.createLocation({
    //     target: document.focusNode,
    //     detail,
    //     source: `simulator${document.id}`,
    //     event: e,
    //   })
    // }

    if (!children || children.size < 1 || !edge) {
      return this.designer.createLocation(locationData)
    }

    let nearRect: Rect | null = null
    let nearIndex = 0
    let nearNode: Node | null = null
    let nearDistance: number | null = null
    let minTop: number | null = null
    let maxBottom: number | null = null

    for (let i = 0, l = children.size; i < l; i++) {
      const node = children.get(i)!
      const index = i
      const instances = this.getComponentInstances(node)
      const inst = instances
        ? instances.length > 1
          ? instances.find(_inst => this.getClosestNodeInstance(_inst, container.id)?.instance === containerInstance)
          : instances[0]
        : null
      const rect = inst ? this.computeComponentInstanceRect(inst) : null

      if (!rect) {
        continue
      }

      const distance = isPointInRect(e as any, rect) ? 0 : distanceToRect(e as any, rect)

      if (distance === 0) {
        nearDistance = distance
        nearNode = node
        nearIndex = index
        nearRect = rect
        break
      }

      // 标记子节点最顶
      if (minTop === null || rect.top < minTop) {
        minTop = rect.top
      }
      // 标记子节点最底
      if (maxBottom === null || rect.bottom > maxBottom) {
        maxBottom = rect.bottom
      }

      if (nearDistance === null || distance < nearDistance) {
        nearDistance = distance
        nearNode = node
        nearIndex = index
        nearRect = rect
      }
    }

    detail.index = nearIndex

    // if (nearNode && nearRect) {
    //   const el = getRectTarget(nearRect)
    //   const inline = el ? isChildInline(el) : false
    //   const row = el ? isRowContainer(el.parentElement!) : false
    //   const vertical = inline || row

    //   // TODO: fix type
    //   const near: {
    //     node: IPublicModelNode
    //     pos: 'before' | 'after' | 'replace'
    //     rect?: IPublicTypeRect
    //     align?: 'V' | 'H'
    //   } = {
    //     node: nearNode.internalToShellNode()!,
    //     pos: 'before',
    //     align: vertical ? 'V' : 'H',
    //   }
    //   detail.near = near
    //   if (isNearAfter(e as any, nearRect, vertical)) {
    //     near.pos = 'after'
    //     detail.index = nearIndex + 1
    //   }
    //   if (!row && nearDistance !== 0) {
    //     const edgeDistance = distanceToEdge(e as any, edge)
    //     if (edgeDistance.distance < nearDistance!) {
    //       const { nearAfter } = edgeDistance
    //       if (minTop == null) {
    //         minTop = edge.top
    //       }
    //       if (maxBottom == null) {
    //         maxBottom = edge.bottom
    //       }
    //       near.rect = new DOMRect(edge.left, minTop, edge.width, maxBottom - minTop)
    //       near.align = 'H'
    //       near.pos = nearAfter ? 'after' : 'before'
    //       detail.index = nearAfter ? children.size : 0
    //     }
    //   }
    // }

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
