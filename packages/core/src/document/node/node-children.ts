import { createLogger } from '@/utils'
import { action, computed, observable } from 'mobx'
import type { Node, NodeSchema } from './node'

export class NodeChildren {
  private logger = createLogger('NodeChildren')

  @observable.ref children: Node[] = []

  @computed
  get length(): number {
    return this.children.length
  }

  constructor(
    readonly owner: Node,
    data?: NodeSchema[],
  ) {
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

  @action
  private internalInitParent() {
    this.children.forEach(child => {
      child.internalSetParent(this.owner)
    })
  }

  @action
  internalUnlinkChild(node: Node) {
    const i = this.children.indexOf(node)
    if (i < 0) {
      return false
    }
    this.children.splice(i, 1)
  }

  get(index: number) {
    if (index < 0 || index >= this.children.length) {
      return null
    }

    return this.children[index]
  }

  has(node: Node): boolean {
    const i = this.children.indexOf(node)
    return i >= 0
  }

  clear() {
    if (this.children.length > 0) {
      for (let i = this.children.length - 1; i >= 0; i--) {
        const subNode = this.children[i]
        if (subNode.children.length > 0) {
          subNode.children.clear()
        }
        subNode.document.removeNode(subNode)
      }
    }
  }

  /**
   * insert a node into the children
   * @param node
   * @param at if at is null or -1, insert the node to the end of the children
   */
  @action
  insert(node: Node, at?: number | null): void {
    const index = at === null || at === -1 ? this.children.length : at!

    const inChildrenIndex = this.children.indexOf(node)

    // node is not in the children
    if (inChildrenIndex < 0) {
      if (index < this.children.length) {
        this.children.splice(index, 0, node)
      } else {
        this.children.push(node)
      }
      node.internalSetParent(this.owner)
    } else {
      if (index === inChildrenIndex) {
        return
      }

      this.children.splice(inChildrenIndex, 1)
      this.children.splice(index, 0, node)
    }
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
}
