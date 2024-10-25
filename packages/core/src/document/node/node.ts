import type { Document } from '../document'
import type { PropKey, PropValue } from '../prop/prop'
import { Props, getConvertedExtraKey } from '../prop/props'
import { NodeChildren } from './node-children'

import { type EventBus, createEventBus, createLogger, uniqueId } from '@/utils'
import { action, computed, observable } from 'mobx'

export interface NodeSchema {
  id: string
  componentName: string
  props?: any
  children?: NodeSchema[]
}

export class Node {
  private logger = createLogger('Node')
  private emitter: EventBus

  readonly isNode = true

  readonly id: string

  readonly componentName: string

  protected _children: NodeChildren | null

  @observable.ref private _parent: Node | null = null

  get parent() {
    return this._parent
  }

  get children() {
    return this._children
  }

  get childrenNodes() {
    return this._children ? this._children.children : []
  }

  /**
   * if the node is the root node, return -1
   */
  @computed get index() {
    if (!this.parent) {
      return -1
    }

    return this.parent!.children!.indexOf(this)
  }

  /**
   * z-index level of the node
   */
  @computed get zLevel(): number {
    if (this._parent) {
      return this._parent.zLevel + 1
    }
    return 0
  }

  private purged = false

  /**
   * 是否已销毁
   */
  get isPurged() {
    return this.purged
  }

  props: Props

  getChildren() {
    return this.children
  }

  getComponentName() {
    return this.componentName
  }

  getParent() {
    return this.parent
  }

  getId() {
    return this.id
  }

  getIndex() {
    return this.index
  }

  getNode() {
    return this
  }

  getRoot() {
    return this.document.rootNode
  }

  getProps() {
    return this.props
  }

  constructor(
    readonly document: Document,
    nodeSchema: NodeSchema,
  ) {
    const { id, componentName, children, props, ...extras } = nodeSchema

    this.id = id || uniqueId('node')
    this.componentName = componentName
    this.props = new Props(this, props, extras)
    this._children = new NodeChildren(this, children)
    this.emitter = createEventBus('Node')

    this.initBuiltinProps()

    // TODO: eventbus
  }

  export() {
    const { props, extras } = this.props.export()

    const schema: NodeSchema = {
      id: this.id,
      componentName: this.componentName,
      props,
      ...extras,
    }

    if (this.children && this.children.size > 0) {
      schema.children = this.children.export()
    }

    return schema
  }

  purge() {
    if (this.purged) {
      return
    }
    this.purged = true
    this.props.purge()
  }

  private initBuiltinProps() {
    this.props.has(getConvertedExtraKey('isHidden')) || this.props.add(getConvertedExtraKey('isHidden'), false)
    this.props.has(getConvertedExtraKey('isLocked')) || this.props.add(getConvertedExtraKey('isLocked'), false)
  }

  hide(flag = true) {
    this.setExtraProp('isHidden', flag)

    // TODO: eventbus
  }

  isHidden() {
    return this.getExtraPropValue('isHidden') as boolean
  }

  lock(flag = true) {
    this.setExtraProp('isLocked', flag)
  }

  isLocked() {
    return this.getExtraPropValue('isLocked') as boolean
  }

  isRoot() {
    return this.document.rootNode === this
  }

  getProp(path: PropKey, createIfNone = true) {
    return this.props.query(path, createIfNone) || null
  }

  getExtraProp(key: PropKey, createIfNone = true) {
    return this.getProp(getConvertedExtraKey(key), createIfNone)
  }

  setExtraProp(key: PropKey, value: PropValue) {
    this.getProp(getConvertedExtraKey(key), true)?.setValue(value)
  }

  getPropValue(path: PropKey) {
    return this.getProp(path, false)?.value
  }

  setPropValue(path: PropKey, value: PropValue) {
    this.getProp(path, true)!.setValue(value)
  }

  getExtraPropValue(key: PropKey) {
    return this.getPropValue(getConvertedExtraKey(key))
  }

  setExtraPropValue(key: PropKey, value: PropValue) {
    this.setPropValue(getConvertedExtraKey(key), value)
  }

  clearPropValue(path: PropKey): void {
    this.getProp(path, false)?.unset()
  }

  internalSetParent(parent: Node | null) {
    if (this._parent === parent) {
      return
    }

    if (this._parent) {
      this._parent.children?.unlinkChild(this)
    }

    if (parent) {
      this._parent = parent
    }
  }

  internalUnlinkParent() {
    this._parent = null
  }

  unlink() {
    if (this.parent) {
      this.parent.children!.unlinkChild(this)
    }
    this.internalUnlinkParent()
  }

  /**
   * insert a node at a specific position
   * @param node
   */
  insert(node: Node, at?: number) {
    node.unlink()
    this.children?.insert(node, at)
  }

  /**
   * insert a node before a reference node(in current node's children)
   */
  insertBefore(node: Node, ref: Node) {
    node.unlink()
    this.children?.insert(node, ref.index)
  }

  /**
   * insert a node after a reference node(in current node's children)
   */
  insertAfter(node: Node, ref: Node) {
    node.unlink()
    this.children?.insert(node, ref.index + 1)
  }

  @action
  remove() {
    if (this.parent) {
      this.parent.children!.delete(this)
    }
  }

  removeChild(node: Node) {
    this.children?.delete(node)
  }

  /**
   * if the node is linked in the document tree
   */
  @computed get isLinked() {
    let current: Node | null = this

    while (current) {
      if (current.isRoot()) {
        return true
      }
      current = current.parent
    }

    return false
  }

  /** whether child nodes are included */
  isParental() {
    return this._children ? !this._children.isEmpty() : false
  }

  /**
   * get all ancestors of the node
   */
  getAncestors() {
    const ancestors: Node[] = []
    let current: Node | null = this

    while (current) {
      if (current.parent) {
        ancestors.push(current.parent)
      }
      current = current.parent
    }

    return ancestors
  }

  /**
   * get all descendants of the node
   */
  getDescendants() {
    const descendants: Node[] = []

    const loop = (children: Node[]) => {
      if (children.length > 0) {
        for (const child of children) {
          descendants.push(child)
          loop(child.childrenNodes)
        }
      }
    }

    loop(this.childrenNodes)
    return descendants
  }

  /**
   * is target node an ancestor of the the node
   */
  isAncestorOf(target: Node) {
    let current: Node | null = this
    while (current) {
      if (current === target) {
        return true
      }
      current = current.parent
    }
    return false
  }

  /**
   * is target node a descendant of the node
   */
  isDescendantOf(target: Node) {
    let current: Node | null = this
    while (current) {
      if (current === target) {
        return true
      }
      current = current.parent
    }

    return false
  }

  get nextSibling(): Node | null | undefined {
    if (!this.parent) {
      return null
    }
    const { index } = this
    if (typeof index !== 'number') {
      return null
    }
    if (index < 0) {
      return null
    }
    return this.parent.children?.get(index + 1)
  }

  get prevSibling(): Node | null | undefined {
    if (!this.parent) {
      return null
    }
    const { index } = this
    if (typeof index !== 'number') {
      return null
    }
    if (index < 1) {
      return null
    }
    return this.parent.children?.get(index - 1)
  }
}

export const isNode = (node: any): node is Node => {
  return node && node.isNode
}
