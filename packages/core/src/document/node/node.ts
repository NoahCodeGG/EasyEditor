import type { Document } from '../document'
import { Props } from '../prop/props'
import { NodeChildren } from './node-children'

import { createLogger, uniqueId } from '@/utils'
import { action, computed, observable, toJS } from 'mobx'

export interface NodeSchema {
  id: string
  componentName: string
  props?: any
  children?: NodeSchema[]
}

export class Node {
  private logger = createLogger('Node')

  @observable.ref id: string

  @observable.ref componentName: string

  @observable.ref private _parent: Node | null = null

  @observable.ref private _children: NodeChildren

  get parent() {
    return this._parent
  }

  get children() {
    return this._children
  }

  get childrenNodes() {
    return this.children.children
  }
  /**
   * if the node is the root node, return -1
   */
  @computed get index() {
    if (!this.parent) {
      return -1
    }

    return this.parent.children.indexOf(this)
  }

  get isRoot() {
    return this.document.rootNode === this
  }

  props: Props

  constructor(
    readonly document: Document,
    nodeSchema: NodeSchema,
  ) {
    const { id, componentName, children = [], props, ...extras } = nodeSchema

    this.id = id || uuid() // 直接随机生成一个Node id
    this.componentName = componentName
    // @ts-ignore
    this.props = this.propsFactory(this, props, extras)
    // @ts-ignore
    this._children = this.nodeChildrenFactory(this, children)

    this.initProps()
  }

  import(nodeSchema: NodeSchema) {
    const { id, componentName, children = [], props, ...extras } = nodeSchema

    this.id = id || uniqueId()
    this.componentName = componentName
    this.props = new Props()
    this._children = new NodeChildren(this, children)
  }

  export() {
    // const { props = {}, extras = {} } = this.props.export() || {}

    const schema: NodeSchema = {
      id: this.id,
      componentName: this.componentName,
      // props,
      // ...extras,
    }

    if (this.children && this.children.length > 0) {
      schema.children = this.children.export()
    }

    return toJS(schema)
  }

  internalSetParent(parent: Node | null) {
    if (this._parent === parent) {
      return
    }

    if (parent) {
      this._parent = parent
    }
  }

  internalUnlinkParent() {
    this._parent = null
  }

  unlink() {
    this.parent?.children.internalUnlinkChild(this)
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
    this.document.removeNode(this)
  }

  /**
   * if the node is linked in the document tree
   */
  @computed get isLinked() {
    let current: Node | null = this

    while (current) {
      if (current.isRoot) {
        return true
      }
      current = current.parent
    }

    return false
  }

  /**
   * depth of the node in the document tree
   * - root node depth is 0
   * - unlinked node depth is -1
   */
  @computed get depth() {
    if (!this.isLinked) {
      return -1
    }
    let count = 0
    let current: Node | null = this

    while (current) {
      if (current.isRoot) {
        break
      }
      current = current.parent
      count++
    }

    return count
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
}
