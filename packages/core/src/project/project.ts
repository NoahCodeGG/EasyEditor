import type { Designer } from '@/designer'
import type { DocumentSchema } from '@/document'

import { Document } from '@/document'
import { createEventBus } from '@/utils/event-bus'
import { computed, observable } from 'mobx'
import { createLogger } from '../utils'

interface ProjectSchema {
  version: string
  documents: DocumentSchema[]
  // TODO: 组件库
  // components: any[]
  // TODO: 插件附加
  [key: string]: any
}

const defaultSchema: ProjectSchema = {
  version: '0.0.1',
  documents: [],
}

enum ProjectEventMap {
  DocumentCreate = 'document:create',
  DocumentRemove = 'document:remove',
  DocumentChange = 'document:change',
}

export class Project {
  private logger = createLogger('Project')
  private emitter = createEventBus('Project')

  private data: ProjectSchema = defaultSchema

  @observable.shallow private documents: Document[] = []

  @computed get currentDocument() {
    return this.documents.find(document => document.active)
  }

  constructor(
    readonly designer: Designer,
    schema?: ProjectSchema,
  ) {
    this.load(schema)
  }

  load(schema?: ProjectSchema, autoOpen?: boolean | string) {
    this.unload()

    this.data = {
      ...defaultSchema,
      ...schema,
    }

    if (autoOpen) {
      // ...
    }
  }

  unload() {
    if (this.documents.length < 1) {
      return
    }
    for (const document of this.documents) {
      document.remove()
    }
  }

  getSchema(): ProjectSchema {
    return {
      ...this.data,
      // documents: this.documents.map(document => document.export()),
    }
  }

  setSchema(schema: ProjectSchema) {
    // this.data = {
    //   ...this.data,
    //   ...schema,
    // }
  }

  createDocument(schema?: DocumentSchema) {
    const document = new Document(this, schema)
    this.documents.push(document)

    this.emitter.emit(ProjectEventMap.DocumentCreate, document)
    return document
  }

  removeDocument(id: string | Document) {
    let document: Document | undefined
    if (typeof id === 'string') {
      document = this.documents.find(document => document.id === id)
    } else {
      document = id
    }

    if (!document) {
      return this.logger.warn('document not found', id)
    }

    document.remove()
    this.documents.splice(this.documents.indexOf(document), 1)

    this.emitter.emit(ProjectEventMap.DocumentRemove, id)
  }

  /**
   * active a document
   */
  open(id: string) {
    const document = this.documents.find(document => document.id === id)
    if (document) {
      document.active = true
    }
    return document
  }

  getDocument(id: string) {
    return this.documents.find(document => document.id === id)
  }

  /**
   * set extra data, available for plugins
   */
  set<T extends keyof ProjectSchema>(key: T, value: ProjectSchema[T]): void
  set(key: string, value: unknown): void
  set(key: string, value: unknown): void {
    Object.assign(this.data, { [key]: value })
  }

  /**
   * get extra data, available for plugins
   */
  get<T extends keyof ProjectSchema>(key: T): ProjectSchema[T]
  get<T>(key: string): T
  get(key: string): unknown
  get(key: string): any {
    return Reflect.get(this.data, key)
  }

  onDocumentCreate(listener: (document: Document) => void) {
    this.emitter.on(ProjectEventMap.DocumentCreate, listener)

    return () => {
      this.emitter.off(ProjectEventMap.DocumentCreate, listener)
    }
  }

  onDocumentRemove(listener: (id: string) => void) {
    this.emitter.on(ProjectEventMap.DocumentRemove, listener)

    return () => {
      this.emitter.off(ProjectEventMap.DocumentRemove, listener)
    }
  }

  onDocumentChange(listener: (document: Document) => void) {
    this.emitter.on(ProjectEventMap.DocumentChange, listener)

    return () => {
      this.emitter.off(ProjectEventMap.DocumentChange, listener)
    }
  }
}
