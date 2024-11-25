import type { Node, NodeSchema } from './node'

import { action, computed, observable } from 'mobx'
import { createEventBus, createLogger } from '../../utils'
import { NODE_EVENT } from './node'

export enum NODE_CHILDREN_EVENT {
  CHANGE = 'nodeChildren:change',
  INSERT = 'nodeChildren:insert',
}

export class NodeChildren {
  private logger = createLogger('NodeChildren')
  private emitter = createEventBus('NodeChildren')

  readonly owner: Node

  @observable.shallow accessor children: Node[] = []

  getNode() {
    return this.owner
  }

  @computed
  get size(): number {
    return this.children.length
  }

  constructor(owner: Node, data?: NodeSchema[]) {
    this.owner = owner
    this.children = (Array.isArray(data) ? data : []).map(child => {
      return this.owner.document.createNode(child)
    })
    this.internalInitParent()
  }

  export() {
    return this.children.map(node => {
      const data = node.export()
      return data
    })
  }

  remove(purge = true, useMutator = true) {
    this.children.forEach(child => {
      child.remove(purge, useMutator)
    })
    this.children.length = 0
  }

  private purged = false

  purge() {
    if (this.purged) {
      return
    }
    this.purged = true
    this.children.forEach(child => {
      child.purge()
    })
  }

  internalInitParent() {
    for (const child of this.children) {
      child.internalSetParent(this.owner)
    }
  }

  @action
  private internalUnlinkChild(node: Node) {
    const i = this.children.indexOf(node)
    if (i < 0) {
      return false
    }

    this.children.splice(i, 1)
    return true
  }

  unlinkChild(node: Node) {
    this.internalUnlinkChild(node)
    this.emitter.emit(NODE_CHILDREN_EVENT.CHANGE, {
      type: 'unlink',
      node,
    })
  }

  delete(node: Node) {
    return this.internalDelete(node)
  }

  internalDelete(node: Node, purge = false, useMutator = true): boolean {
    if (node.isParentalNode) {
      node.children?.remove(purge, useMutator)
    }

    if (purge) {
      // should set parent null
      node.internalSetParent(null, useMutator)
      try {
        node.purge()
      } catch (err) {
        console.error(err)
      }
    }

    const { document } = node
    document.unlinkNode(node)
    document.designer.selection.remove(node.id)
    node.unlink()
    this.emitter.emit(NODE_CHILDREN_EVENT.CHANGE, {
      type: 'delete',
      node,
    })

    return true
  }

  isEmpty() {
    return this.size < 1
  }

  get(index: number) {
    if (index < 0 || index >= this.children.length) {
      return null
    }

    return this.children[index]
  }

  has(node: Node) {
    return this.children.indexOf(node) > -1
  }

  /**
   * insert a node into the children
   * @param node
   * @param at if at is null or -1, insert the node to the end of the children
   */
  @action
  insert(node: Node, at?: number | null): void {
    const { children } = this
    const index = at === null || at === -1 ? this.children.length : at!

    const inChildrenIndex = this.children.indexOf(node)

    // node is not in the children
    if (inChildrenIndex < 0) {
      if (index < children.length) {
        children.splice(index, 0, node)
      } else {
        children.push(node)
      }
      node.internalSetParent(this.owner)
    } else {
      if (index === inChildrenIndex) {
        return
      }

      children.splice(inChildrenIndex, 1)
      children.splice(index, 0, node)
    }

    this.emitter.emit(NODE_CHILDREN_EVENT.CHANGE, {
      type: 'insert',
      node,
    })
    this.emitter.emit(NODE_CHILDREN_EVENT.INSERT, node)
    const designer = this.owner.document.designer
    designer.postEvent(NODE_EVENT.ADD, node)
  }

  indexOf(node: Node): number {
    return this.children.map(d => d.id).indexOf(node.id)
  }

  find(f: (value: Node, index: number, obj: Node[]) => unknown) {
    return this.children.find(f)
  }

  forEach(fn: (node: Node, index: number) => void): void {
    this.children.forEach((item: Node, index: number) => {
      fn(item, index)
    })
  }

  reverse(): Node[] {
    return this.children.reverse()
  }

  map(fn: (node: Node, index: number) => Node): Node[] {
    return this.children.map((item: Node, index: number): Node => {
      return fn(item, index)
    })
  }

  every(fn: (node: Node, index: number) => boolean): boolean {
    return this.children.every((item: Node, index: number) => {
      return fn(item, index)
    })
  }

  some(fn: (node: Node, index: number) => boolean): boolean {
    return this.children.some((item: Node, index: number) => {
      return fn(item, index)
    })
  }

  filter(fn: (node: Node, index: number) => boolean): Node[] {
    return this.children.filter((item: Node, index: number) => {
      return fn(item, index)
    })
  }

  reduce(fn: (acc: any, cur: Node) => any, initialValue: any) {
    return this.children.reduce((acc: any, cur: Node) => {
      return fn(acc, cur)
    }, initialValue)
  }

  onChange(listener: (info?: { type: string; node: Node }) => void) {
    this.emitter.on(NODE_CHILDREN_EVENT.CHANGE, listener)
    return () => {
      this.emitter.off(NODE_CHILDREN_EVENT.CHANGE, listener)
    }
  }

  onInsert(listener: (node: Node) => void) {
    this.emitter.on(NODE_CHILDREN_EVENT.INSERT, listener)
    return () => {
      this.emitter.off(NODE_CHILDREN_EVENT.INSERT, listener)
    }
  }
}
