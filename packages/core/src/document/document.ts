import type { Designer } from '../designer'
import type { Project } from '../project'
import type { EventBus } from '../utils'
import type { NodeSchema } from './node/node'

import { action, observable } from 'mobx'
import type { Simulator } from '../simulator'
import { createEventBus, createLogger, uniqueId } from '../utils'
import { History } from './history'
import { NODE_EVENT, Node, isNode } from './node/node'

export interface DocumentSchema {
  id: string
  name: string
  rootNode: NodeSchema
}

export enum DOCUMENT_EVENT {
  ADD = 'document:add',
  REMOVE = 'document:remove',
  OPEN_CHANGE = 'document:open.change',
  OPEN = 'document:open',
}

export class Document {
  private logger = createLogger('Document')
  private emitter: EventBus

  id: string

  /** document is open or not */
  @observable.ref accessor _opened = false

  /** document is blank or not */
  private _blank = true

  /** document root node */
  rootNode: Node | null = null

  getRoot() {
    return this.rootNode
  }

  private _nodesMap = new Map<Node['id'], Node>()

  get nodesMap() {
    return this._nodesMap
  }

  get simulator(): Simulator | null {
    return this.project.simulator
  }

  @observable.shallow private accessor nodes = new Set<Node>()

  get name() {
    return (this.rootNode?.getExtraProp('name', false)?.getValue() as string) || this.id
  }

  set name(name: string) {
    this.rootNode?.getExtraProp('name', true)?.setValue(name)
  }

  get opened() {
    return this._opened
  }

  isBlank() {
    // return !!(this._blank && !this.isModified());
    return this._blank
  }

  readonly history: History

  getHistory() {
    return this.history
  }

  readonly project: Project

  readonly designer: Designer

  constructor(project: Project, schema?: DocumentSchema) {
    this.id = schema?.id ?? uniqueId('doc')
    this.project = project
    this.designer = project.designer
    this.emitter = createEventBus('Document')
    this.import(schema)

    this.history = new History(
      () => this.export(),
      schema => {
        this.import(schema)
        // this.designer.rerender()
      },
      this,
    )
  }

  @action
  import(schema?: DocumentSchema) {
    this.remove()

    this.id = schema?.id ?? uniqueId('doc')
    if (schema) {
      this.name = schema?.name
      if (schema?.rootNode) {
        this.rootNode = this.createNode(schema.rootNode)
        this._blank = false
      }
    } else {
      this._blank = true
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

    this.designer.postEvent(DOCUMENT_EVENT.REMOVE, this.id)
  }

  purge() {
    this.rootNode?.purge()
    this.nodes.clear()
    this._nodesMap.clear()
    this.rootNode = null
  }

  @action
  createNode(schema: NodeSchema) {
    if (this.hasNode(schema?.id)) {
      this.logger.error('node already exists', schema.id)
      return this.getNode(schema.id)!
    }

    const node = new Node(this, schema)
    this.nodes.add(node)
    this._nodesMap.set(node.id, node)

    return node
  }

  getNode(id: string) {
    return this._nodesMap.get(id) || null
  }

  getNodeCount(): number {
    return this._nodesMap.size
  }

  hasNode(id: string) {
    const node = this.getNode(id)
    return node ? !node.isPurged : false
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
    if (!this.nodes.has(node)) {
      return this.logger.warn('node not found', node)
    }

    if (node.isRoot()) {
      this.rootNode = null
    }

    node.remove()
  }

  unlinkNode(node: Node) {
    this.nodes.delete(node)
    this._nodesMap.delete(node.id)
  }

  batchRemoveNode(idOrNodeList: (string | Node)[]) {
    for (const item of idOrNodeList) {
      this.removeNode(item)
    }
  }

  insertNode(parent: Node, thing: Node | NodeSchema, at?: number) {
    let node: Node | null | undefined

    if (isNode(thing)) {
      node = thing
    } else {
      node = parent.document?.createNode(thing)
    }

    if (isNode(node)) {
      parent.children?.insert(node, at)
      return node
    }
  }

  /**
   * insert multiple nodes
   */
  insertNodes(parent: Node, nodes: Node[] | NodeSchema[], at?: number) {
    let index = at
    let node: Node | NodeSchema | null | undefined
    const results: Node[] = []

    while ((node = nodes.pop())) {
      node = this.insertNode(parent, node, index)
      results.push(node!)
      index = node?.index ?? index
    }

    return results
  }

  open() {
    const originState = this._opened
    this._opened = true
    // only emit when document is suspense
    if (originState === false) {
      this.designer.postEvent(DOCUMENT_EVENT.OPEN, this)
    }
    if (this._opened) {
      this.project.checkExclusive(this)
    } else {
      this.setOpened(false)
    }

    return this
  }

  close(): void {
    this.setOpened(false)
    this._opened = false
  }

  /**
   * use open a document and suspense other documents
   */
  private setOpened(flag: boolean) {
    if (!this._opened && !flag) {
      return
    }

    this._opened = flag
    // this.simulator?.setSuspense(flag);
    if (!flag) {
      this.project.checkExclusive(this)
    }
  }

  suspense() {
    this.setOpened(false)
  }

  activate() {
    this.setOpened(true)
  }

  /**
   * check if there is unsaved change for document
   */
  isModified() {
    return this.history.isSavePoint()
  }

  /**
   * get components map of all the nodes in this document
   * @param extraComps - extra components that will be added to the components map, use for custom components
   */
  getComponentsMap(extraComps?: string[]) {
    const componentsMap: Record<Node['componentName'], any> = []
    // use map to avoid duplicate
    const existedMap: Record<Node['componentName'], boolean> = {}

    for (const node of this._nodesMap.values()) {
      // TODO: 组件具体内容添加
      const { componentName } = node || {}
      if (!existedMap[componentName]) {
        existedMap[componentName] = true
        componentsMap.push({
          devMode: 'lowCode',
          componentName,
        })
      }
    }

    // combine extra components
    if (Array.isArray(extraComps)) {
      extraComps.forEach(componentName => {
        if (componentName && !existedMap[componentName]) {
          componentsMap.push({
            devMode: 'lowCode',
            componentName,
          })
        }
      })
    }

    return componentsMap
  }

  getComponent(componentName: string) {
    return this.simulator!.getComponent(componentName)
  }

  getComponentMeta(componentName: string) {
    return this.designer.componentMetaManager.getComponentMeta(componentName)
  }

  onReady(listener: () => void) {
    const dispose = this.designer.onEvent(DOCUMENT_EVENT.OPEN, listener)

    return () => {
      dispose()
    }
  }

  onNodeAdd(listener: (node: Node) => void) {
    const dispose = this.designer.onEvent(NODE_EVENT.ADD, listener)

    return () => {
      dispose()
    }
  }

  onNodeRemove(listener: (id: string) => void) {
    const dispose = this.designer.onEvent(NODE_EVENT.REMOVE, listener)

    return () => {
      dispose()
    }
  }
}

export function isDocument(obj: any): obj is Document {
  return obj && obj.rootNode
}
