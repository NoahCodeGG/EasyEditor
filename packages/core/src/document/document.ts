import { observable } from 'mobx'
import type { NodeSchema } from './node/node'

import type { Project } from '@/project'
import { createEventBus, createLogger, uniqueId } from '../utils'

export interface DocumentSchema {
  id: string
  name: string
  rootNode: NodeSchema
}

export class Document {
  private logger = createLogger('Document')
  private emitter = createEventBus('Document')

  @observable.ref id: string

  @observable.ref private name: string | null = null

  /** document is or not active */
  @observable.ref active = false

  /** document root node */
  @observable.ref private rootNode: Node | null = null

  constructor(
    readonly project: Project,
    schema?: DocumentSchema,
  ) {
    if (schema) {
      this.id = schema.id
      this.name = schema.name
      this.rootNode = this.createNode(schema.rootNode)
    } else {
      this.id = uniqueId('doc')
    }
  }

  createNode(schema: NodeSchema) {
    return new Node()
  }

  remove() {}
}
