import type { Project } from '@/project'
import type { EventBus } from '../utils'
import type { Node, NodeSchema } from './node/node'

import { action, observable } from 'mobx'
import { createEventBus, createLogger, uniqueId } from '../utils'

export interface DocumentSchema {
  id: string
  name: string
  rootNode: NodeSchema
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

    this.id = schema?.id ?? uniqueId('doc')

    if (schema) {
      this.name = schema?.name
      this.rootNode = this.createNode(schema?.rootNode)
    }
  }

  @action
  import(schema: any) {
    // 删除之前的节点信息，避免与历史记录的节点冲突
    this.remove()

    // a before hook
    const name = schema?.name ?? ''
    if (typeof name !== 'string') throw new Error('import schema error: schema.name should be string')
    this.name = name
    if (schema?.rootNode) {
      this.rootNode = this.createNode(schema?.rootNode)
    }
    // a after hook
  }

  export() {
    const schema: any = {
      id: this.id,
      name: this.name,
      rootNode: this.rootNode?.exportSchema(),
    }
    return this.hooks.processExportedDocSchema.call({ schema, document: this as any }).schema
  }

  remove() {
    this.purge()
    this.project.removeDocument(this)
  }

  purge() {
    this.rootNode?.purge()
    this.nodes.clear()
    this.nodeMap.clear()
    this.rootNode = null
  }

  createNode(schema: NodeSchema) {
    return new Node()
  }
}
