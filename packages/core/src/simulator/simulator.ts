import {
  type Component,
  type ComponentInstance,
  type Designer,
  type LocateEvent,
  type NodeInstance,
  type Rect,
  clipboard,
  isElement,
} from '@/designer'
import type { Node } from '@/document'
import type { Project } from '@/project'
import { createEventBus } from '@/utils'
import {
  type IReactionDisposer,
  type IReactionOptions,
  type IReactionPublic,
  autorun,
  computed,
  observable,
  reaction,
} from 'mobx'
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

  autoRender = true

  @computed get designMode(): DesignMode {
    return this.get('designMode') || 'design'
  }

  @observable.ref _props: SimulatorProps = {}

  @observable.ref private _contentWindow?: Window

  get contentWindow() {
    return this._contentWindow
  }

  @observable.ref private _contentDocument?: Document

  get contentDocument() {
    return this._contentDocument
  }

  @observable private instancesMap: {
    [docId: string]: Map<string, ComponentInstance[]>
  } = {}

  private _iframe?: HTMLIFrameElement

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

  stopAutoRepaintNode() {
    this.renderer?.stopAutoRepaintNode()
  }

  enableAutoRepaintNode() {
    this.renderer?.enableAutoRepaintNode()
  }

  connect(renderer: SimulatorRenderer, effect: (reaction: IReactionPublic) => void, options?: IReactionOptions) {
    this._renderer = renderer
    return autorun(effect, options)
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

  mountViewport(viewport: HTMLElement | null) {
    this.viewport.mount(viewport)
  }

  rerender() {
    this.designer.refreshComponentMetasMap()
    this.renderer?.rerender?.()
  }

  async mountContentFrame(iframe: HTMLIFrameElement | null): Promise<void> {
    if (!iframe || this._iframe === iframe) {
      return
    }
    this._iframe = iframe

    this._contentWindow = iframe.contentWindow!
    this._contentDocument = this._contentWindow.document

    // init events, overlays
    this.setupEvents()

    // bind hotkey & clipboard
    // const hotkey = this.designer.editor.get('innerHotkey')
    // hotkey.mount(this._contentWindow)
    clipboard.injectCopyPaster(this._contentDocument)

    // TODO: dispose the bindings
  }

  setupEvents() {
    // TODO: Thinkof move events control to simulator renderer
    //       just listen special callback
    // because iframe maybe reload
    this.setupDragAndClick()
    this.setupDetecting()
    this.setupLiveEditing()
    this.setupContextMenu()
  }

  postEvent(eventName: string, ...data: any[]) {
    this.emitter.emit(eventName, ...data)
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

  setupLiveEditing() {
    const doc = this.contentDocument!
    // cause edit
    doc.addEventListener(
      'dblclick',
      (e: MouseEvent) => {
        // stop response document dblclick event
        e.stopPropagation()
        e.preventDefault()

        const targetElement = e.target as HTMLElement
        const nodeInst = this.getNodeInstanceFromElement(targetElement)
        if (!nodeInst) {
          return
        }
        const focusNode = this.project.currentDocument?.focusNode
        const node = nodeInst.node || focusNode
        if (!node || isLowCodeComponent(node)) {
          return
        }

        const rootElement = this.findDOMNodes(nodeInst.instance, node.componentMeta.rootSelector)?.find(
          item =>
            // 可能是 [null];
            item && item.contains(targetElement),
        ) as HTMLElement
        if (!rootElement) {
          return
        }

        this.liveEditing.apply({
          node,
          rootElement,
          event: e,
        })
      },
      true,
    )
  }

  getComponent(componentName: string): Component | null {
    return this.renderer?.getComponent(componentName) || null
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

  getComponentInstances(node: Node, context?: NodeInstance): ComponentInstance[] | null {
    const docId = node.document?.id
    if (!docId) {
      return null
    }

    const instances = this.instancesMap[docId]?.get(node.id) || null
    if (!instances || !context) {
      return instances
    }

    // filter with context
    return instances.filter(instance => {
      return this.getClosestNodeInstance(instance, context?.nodeId)?.instance === context.instance
    })
  }

  getNodeInstanceFromElement(target: Element | null): NodeInstance<ComponentInstance, Node> | null {
    if (!target) {
      return null
    }

    const nodeInstance = this.getClosestNodeInstance(target)
    if (!nodeInstance) {
      return null
    }
    const { docId } = nodeInstance
    const doc = this.project.getDocument(docId)!
    const node = doc.getNode(nodeInstance.nodeId)
    return {
      ...nodeInstance,
      node,
    }
  }

  getClosestNodeInstance(from: ComponentInstance, specId?: string): NodeInstance<ComponentInstance> | null {
    return this.renderer?.getClosestNodeInstance(from, specId) || null
  }

  findDOMNodes(instance: ComponentInstance, selector?: string): Array<Element | Text> | null {
    const elements = this._renderer?.findDOMNodes(instance)
    if (!elements) {
      return null
    }

    if (selector) {
      const matched = getMatched(elements, selector)
      if (!matched) {
        return null
      }
      return [matched]
    }
    return elements
  }

  computeRect(node: Node): Rect | null {
    const instances = this.getComponentInstances(node)
    if (!instances) {
      return null
    }
    return this.computeComponentInstanceRect(instances[0], node.componentMeta.rootSelector)
  }

  computeComponentInstanceRect(instance: ComponentInstance, selector?: string): IPublicTypeRect | null {
    const renderer = this.renderer!
    const elements = this.findDOMNodes(instance, selector)
    if (!elements) {
      return null
    }

    const elems = elements.slice()
    let rects: DOMRect[] | undefined
    let last: { x: number; y: number; r: number; b: number } | undefined
    let _computed = false
    while (true) {
      if (!rects || rects.length < 1) {
        const elem = elems.pop()
        if (!elem) {
          break
        }
        rects = renderer.getClientRects(elem)
      }
      const rect = rects!.pop()
      if (!rect) {
        break
      }
      if (rect.width === 0 && rect.height === 0) {
        continue
      }
      if (!last) {
        last = {
          x: rect.left,
          y: rect.top,
          r: rect.right,
          b: rect.bottom,
        }
        continue
      }
      if (rect.left < last.x) {
        last.x = rect.left
        _computed = true
      }
      if (rect.top < last.y) {
        last.y = rect.top
        _computed = true
      }
      if (rect.right > last.r) {
        last.r = rect.right
        _computed = true
      }
      if (rect.bottom > last.b) {
        last.b = rect.bottom
        _computed = true
      }
    }

    if (last) {
      const r: Rect = new DOMRect(last.x, last.y, last.r - last.x, last.b - last.y)
      r.elements = elements
      r.computed = _computed
      return r
    }

    return null
  }

  setNativeSelection(enableFlag: boolean) {
    this.renderer?.setNativeSelection(enableFlag)
  }

  setDraggingState(state: boolean) {
    this.renderer?.setDraggingState(state)
  }

  setCopyState(state: boolean) {
    this.renderer?.setCopyState(state)
  }

  clearState() {
    this.renderer?.clearState()
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

  /**
   * @see IPublicModelSensor
   */
  isEnter(e: LocateEvent): boolean {
    const rect = this.viewport.bounds
    return e.globalY >= rect.top && e.globalY <= rect.bottom && e.globalX >= rect.left && e.globalX <= rect.right
  }

  /**
   * @see IPublicModelSensor
   */
  deactiveSensor() {
    this.sensing = false
  }
}

export function isSimulator(obj: any): obj is Simulator {
  return obj && obj.isSimulator
}

function getMatched(elements: Array<Element | Text>, selector: string): Element | null {
  let firstQueried: Element | null = null
  for (const elem of elements) {
    if (isElement(elem)) {
      if (elem.matches(selector)) {
        return elem
      }

      if (!firstQueried) {
        firstQueried = elem.querySelector(selector)
      }
    }
  }
  return firstQueried
}
