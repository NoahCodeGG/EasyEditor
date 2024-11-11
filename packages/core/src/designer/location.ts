import type { Document as IDocument, Node as INode } from '../document'
import type { DragObject, Sensor } from './dragon'

export interface Point {
  clientX: number
  clientY: number
}

export interface CanvasPoint {
  canvasX: number
  canvasY: number
}

export type Rect = DOMRect & {
  elements?: Array<Element | Text>
  computed?: boolean
}

export type Rects = DOMRect[] & {
  elements: Array<Element | Text>
}

export enum LocationDetailType {
  Children = 'Children',
  Prop = 'Prop',
}

export interface LocationChildrenDetail {
  type: LocationDetailType.Children
  index?: number | null

  /**
   * 是否有效位置
   */
  valid?: boolean
  edge?: DOMRect
  near?: {
    node: INode
    pos: 'before' | 'after' | 'replace'
    rect?: Rect
    align?: 'V' | 'H'
  }
  focus?: { type: 'slots' } | { type: 'node'; node: INode }
}

export interface LocationPropDetail {
  // cover 形态，高亮 domNode，如果 domNode 为空，取 container 的值
  type: LocationDetailType.Prop
  name: string
  domNode?: HTMLElement
}

export type LocationDetail = LocationChildrenDetail | LocationPropDetail | { [key: string]: any; type: string }

export interface LocationData<Node = INode> {
  target: Node // shadowNode | ConditionFlow | ElementNode | RootNode
  detail: LocationDetail
  source: string
  event: LocateEvent
}

export interface LocateEvent {
  get type(): string

  /**
   * browser window coordinate system
   */
  readonly globalX: number
  readonly globalY: number

  readonly originalEvent: MouseEvent | DragEvent

  /**
   * browser event response target
   */
  target?: Element | null

  /**
   * event correction identifier, initially constructed from the initiating end, missing canvasX,canvasY, needs to be corrected
   */
  fixed?: true

  canvasX?: number
  canvasY?: number

  /**
   * active or target document
   */
  document?: Document | null

  get dragObject(): DragObject | null

  sensor?: Sensor
}

export function isLocationData(obj: any): obj is LocationData {
  return obj && obj.target && obj.detail
}

export function isLocationChildrenDetail(obj: any): obj is LocationChildrenDetail {
  return obj && obj.type === LocationDetailType.Children
}

// export function isRowContainer(container: Element | Text, win?: Window) {
//   if (isText(container)) {
//     return true
//   }
//   const style = (win || getWindow(container)).getComputedStyle(container)
//   const display = style.getPropertyValue('display')
//   if (/flex$/.test(display)) {
//     const direction = style.getPropertyValue('flex-direction') || 'row'
//     if (direction === 'row' || direction === 'row-reverse') {
//       return true
//     }
//   }
//   if (/grid$/.test(display)) {
//     return true
//   }
//   return false
// }

// export function isChildInline(child: Element | Text, win?: Window) {
//   if (isText(child)) {
//     return true
//   }
//   const style = (win || getWindow(child)).getComputedStyle(child)
//   return /^inline/.test(style.getPropertyValue('display')) || /^(left|right)$/.test(style.getPropertyValue('float'))
// }

// export function getRectTarget(rect: Rect | null) {
//   if (!rect || rect.computed) {
//     return null
//   }
//   const els = rect.elements
//   return els && els.length > 0 ? els[0]! : null
// }

// export function isVerticalContainer(rect: Rect | null) {
//   const el = getRectTarget(rect)
//   if (!el) {
//     return false
//   }
//   return isRowContainer(el)
// }

// export function isVertical(rect: Rect | null) {
//   const el = getRectTarget(rect)
//   if (!el) {
//     return false
//   }
//   return isChildInline(el) || (el.parentElement ? isRowContainer(el.parentElement) : false)
// }

export function isText(elem: any): elem is Text {
  return elem.nodeType === Node.TEXT_NODE
}

export function isElementNode(node: any): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

export function isDocumentNode(elem: any): elem is Document {
  return elem.nodeType === Node.DOCUMENT_NODE
}

export function getWindow(elem: Element | Document): Window {
  return (isDocumentNode(elem) ? elem : elem.ownerDocument!).defaultView!
}

export class DropLocation {
  readonly target: INode

  readonly detail: LocationDetail

  readonly event: LocateEvent

  readonly source: string

  get document(): IDocument | null {
    return this.target.document
  }

  constructor({ target, detail, source, event }: LocationData) {
    this.target = target
    this.detail = detail
    this.source = source
    this.event = event
  }

  clone(event: LocateEvent): DropLocation {
    return new DropLocation({
      target: this.target,
      detail: this.detail,
      source: this.source,
      event,
    })
  }

  // /**
  //  * @deprecated
  //  * 兼容 vision
  //  */
  // getContainer() {
  //   return this.target
  // }

  // /**
  //  * @deprecated
  //  * 兼容 vision
  //  */
  // getInsertion() {
  //   if (!this.detail) {
  //     return null
  //   }
  //   if (this.detail.type === 'Children') {
  //     if (this.detail.index <= 0) {
  //       return null
  //     }
  //     return this.target.children?.get(this.detail.index - 1)
  //   }
  //   return (this.detail as any)?.near?.node
  // }
}
