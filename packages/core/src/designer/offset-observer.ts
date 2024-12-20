import { computed, observable } from 'mobx'
import type { ComponentInstance, Node, Viewport } from '..'
import { uniqueId } from '../utils'

export interface NodeSelector {
  node: Node
  instance?: ComponentInstance
}

export class OffsetObserver {
  readonly id = uniqueId('oobx')

  private lastOffsetLeft?: number

  private lastOffsetTop?: number

  private lastOffsetHeight?: number

  private lastOffsetWidth?: number

  @observable private accessor _height = 0

  @observable private accessor _width = 0

  @observable private accessor _left = 0

  @observable private accessor _top = 0

  @observable private accessor _right = 0

  @observable private accessor _bottom = 0

  @computed
  get height() {
    return this.isRoot ? this.viewport.height : this._height * this.scale
  }

  @computed
  get width() {
    return this.isRoot ? this.viewport.width : this._width * this.scale
  }

  @computed
  get top() {
    return this.isRoot ? 0 : this._top * this.scale
  }

  @computed
  get left() {
    return this.isRoot ? 0 : this._left * this.scale
  }

  @computed
  get bottom() {
    return this.isRoot ? this.viewport.height : this._bottom * this.scale
  }

  @computed
  get right() {
    return this.isRoot ? this.viewport.width : this._right * this.scale
  }

  @observable accessor hasOffset = false

  // TODO：scroll 暂时用不到
  offsetLeft = 0
  offsetTop = 0
  offsetHeight = 0
  offsetWidth = 0

  // @computed
  // get offsetLeft() {
  //   if (this.isRoot) {
  //     return this.viewport.scrollX * this.scale
  //   }
  //   if (!this.viewport.scrolling || this.lastOffsetLeft == null) {
  //     this.lastOffsetLeft = this.left + this.viewport.scrollX * this.scale
  //   }
  //   return this.lastOffsetLeft
  // }

  // @computed
  // get offsetTop() {
  //   if (this.isRoot) {
  //     return this.viewport.scrollY * this.scale
  //   }
  //   if (!this.viewport.scrolling || this.lastOffsetTop == null) {
  //     this.lastOffsetTop = this.top + this.viewport.scrollY * this.scale
  //   }
  //   return this.lastOffsetTop
  // }

  // @computed
  // get offsetHeight() {
  //   if (!this.viewport.scrolling || this.lastOffsetHeight == null) {
  //     this.lastOffsetHeight = this.isRoot ? this.viewport.height : this.height
  //   }
  //   return this.lastOffsetHeight
  // }

  // @computed
  // get offsetWidth() {
  //   if (!this.viewport.scrolling || this.lastOffsetWidth == null) {
  //     this.lastOffsetWidth = this.isRoot ? this.viewport.width : this.width
  //   }
  //   return this.lastOffsetWidth
  // }

  @computed
  get scale() {
    return this.viewport.scale
  }

  private pid: number | undefined

  readonly viewport: Viewport

  private isRoot: boolean

  readonly node: Node

  readonly compute: () => void

  constructor(readonly nodeInstance: NodeSelector) {
    const { node, instance } = nodeInstance
    this.node = node
    const doc = node.document
    const host = doc?.simulator!
    const rootNode = doc?.rootNode
    this.isRoot = node.contains(rootNode!)
    this.viewport = host?.viewport!
    if (this.isRoot) {
      this.hasOffset = true
      return
    }
    if (!instance) {
      return
    }

    let pid: number | undefined
    const compute = () => {
      if (pid !== this.pid) {
        return
      }

      const rect = host.computeComponentInstanceRect(instance!)

      if (!rect) {
        this.hasOffset = false
      } else if (!this.hasOffset) {
        this._height = rect.height
        this._width = rect.width
        this._left = rect.left
        this._top = rect.top
        this._right = rect.right
        this._bottom = rect.bottom
        this.hasOffset = true
      }
      this.pid = requestIdleCallback(compute)
      pid = this.pid
    }

    this.compute = compute

    // try first
    compute()
    // try second, ensure the dom mounted
    this.pid = requestIdleCallback(compute)
    pid = this.pid
  }

  purge() {
    if (this.pid) {
      cancelIdleCallback(this.pid)
    }
    this.pid = undefined
  }

  isPurged() {
    return this.pid == null
  }
}

export function createOffsetObserver(nodeInstance: NodeSelector): OffsetObserver | null {
  if (!nodeInstance.instance) {
    return null
  }
  return new OffsetObserver(nodeInstance)
}
