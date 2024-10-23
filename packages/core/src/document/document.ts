import type { Project } from '@/project'
import type { EventBus } from '../utils'
import type { NodeSchema } from './node/node'

import { action, observable } from 'mobx'
import { createEventBus, createLogger, uniqueId } from '../utils'
import { Node } from './node/node'

export interface DocumentSchema {
  id: string
  name: string
  rootNode: NodeSchema
}

enum DocumentEventMap {
  NodeCreate = 'document:node:create',
  NodeRemove = 'document:node:remove',
}

export class Document {
  private logger = createLogger('Document')
  private emitter: EventBus

  @observable.ref id: string

  @observable.ref private name: string | null = null

  /** document is active or not */
  @observable.ref active = false

  /** document is blank or not */
  @observable.ref isBlank = true

  /** document root node */
  @observable.ref rootNode: Node | null = null

  @observable.shallow activeNode?: Node

  private nodeMap = new Map<Node['id'], Node>()

  @observable.shallow private nodes: Node[] = []

  // history: History

  constructor(
    readonly project: Project,
    schema?: DocumentSchema,
  ) {
    this.emitter = createEventBus('Document')

    if (schema) {
      this.name = schema?.name
      this.rootNode = this.createNode(schema?.rootNode)
    }
  }

  @action
  import(schema: DocumentSchema) {
    // 删除之前的节点信息，避免与历史记录的节点冲突
    this.remove()

    this.id = schema?.id ?? uniqueId('doc')
    this.name = schema?.name ?? ''
    if (schema?.rootNode) {
      this.rootNode = this.createNode(schema.rootNode)
    }
  }

  export(): DocumentSchema {
    const schema: any = {
      id: this.id,
      name: this.name,
      rootNode: this.rootNode?.export(),
    }

    return schema
  }

  remove() {
    this.purge()
    this.project.removeDocument(this)
  }

  purge() {
    this.rootNode?.purge()
    this.nodes.length = 0
    this.nodeMap.clear()
    this.rootNode = null
  }

  @action
  createNode(schema: NodeSchema) {
    const node = new Node(this, schema)

    this.nodeMap.set(node.id, node)
    this.nodes.push(node)

    this.emitter.emit(DocumentEventMap.NodeCreate, node)

    return node
  }

  getNode(id: string) {
    return this.nodeMap.get(id) || null
  }

  hasNode(id: string) {
    const node = this.getNode(id)
    return !!node
  }

  open() {
    this.project.open(this.id)
    return this
  }

  removeNode(idOrNode: string | Node) {
    let node: Node | null

    if (typeof idOrNode === 'string') {
      node = this.getNode(idOrNode)
    } else {
      node = idOrNode
    }

    if (!node) {
      return this.logger.warn('node not found', idOrNode)
    }

    this.internalRemoveNode(node)
  }

  @action
  private internalRemoveNode(node: Node) {
    if (node.isRoot) {
      this.rootNode = null
    }
    if (node?.children.length > 0) {
      node.children.clear()
    }
    if (node.parent) {
      node.parent?.children.internalUnlinkChild(node)
      node.internalUnlinkParent()
    }

    this.nodes.splice(this.nodes.indexOf(node), 1)
    this.nodeMap.delete(node.id)

    this.emitter.emit(DocumentEventMap.NodeRemove, node.id)
  }

  batchRemoveNode(idOrNodeList: (string | Node)[]) {
    for (const item of idOrNodeList) {
      this.removeNode(item)
    }
  }

  insertNode(node: Node, ref: Node) {
    if (this.rootNode === ref) {
      return this.logger.error('ref is root node, please insert to ref.children, There can only be one root node')
    }
    if (ref.index === -1) {
      return this.logger.error('ref has no parent')
    }

    node.unlink()
    ref.parent!.children!.insert(node, ref ? ref.index + 1 : null)
  }

  onNodeCreate(listener: (node: Node) => void) {
    this.emitter.on(DocumentEventMap.NodeCreate, listener)

    return () => {
      this.emitter.off(DocumentEventMap.NodeCreate, listener)
    }
  }

  onNodeRemove(listener: (id: string) => void) {
    this.emitter.on(DocumentEventMap.NodeRemove, listener)

    return () => {
      this.emitter.off(DocumentEventMap.NodeRemove, listener)
    }
  }
}
