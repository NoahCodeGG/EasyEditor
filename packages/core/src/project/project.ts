import type { Designer } from '@/designer'
import type { DocumentSchema } from '@/document'

import { Document, isDocument } from '@/document'
import { createEventBus } from '@/utils/event-bus'
import { computed, observable } from 'mobx'
import { createLogger } from '../utils'

interface ProjectSchema {
  version: string
  documents: DocumentSchema[]
  config?: Record<string, any>
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

  private documentsMap = new Map<string, Document>()

  @computed get currentDocument() {
    return this.documents.find(document => document.open)
  }

  @observable private _config: Record<string, any> | undefined

  @computed get config(): Record<string, any> | undefined {
    return this._config
  }

  set config(value: Record<string, any>) {
    this._config = value
  }

  constructor(
    readonly designer: Designer,
    schema?: ProjectSchema,
  ) {
    this.load(schema)
  }

  /**
   * load project schema
   * @param schema project schema
   * @param autoOpen auto open document, if type is string, will open document by id, if type is boolean, will open first document
   */
  load(schema?: ProjectSchema, autoOpen?: boolean | string) {
    this.unload()

    this.data = {
      ...defaultSchema,
      ...schema,
    }

    if (schema?.config) {
      this._config = schema.config
    }

    if (schema?.documents) {
      for (const document of schema.documents) {
        this.createDocument(document)
      }
    }

    if (autoOpen) {
      if (this.documents.length < 1) {
        return this.logger.warn('no document found, skip auto open')
      }

      if (typeof autoOpen === 'string') {
        this.open(autoOpen)
      } else if (typeof autoOpen === 'boolean') {
        this.open(this.documents[0].id)
      }
    }
  }

  unload() {
    if (this.documents.length < 1) {
      return
    }
    for (let i = this.documents.length - 1; i >= 0; i--) {
      this.documents[i].remove()
    }
  }

  getSchema(): ProjectSchema {
    return {
      ...this.data,
      documents: this.documents.map(document => document.export()),
    }
  }

  setSchema(schema: ProjectSchema) {
    this.load(schema)
  }

  createDocument(schema?: DocumentSchema) {
    const doc = new Document(this, schema)
    this.documents.push(doc)
    this.documentsMap.set(doc.id, doc)
    this.emitter.emit(ProjectEventMap.DocumentCreate, doc)
    return doc
  }

  removeDocument(idOrDoc: string | Document) {
    let document: Document | undefined
    if (typeof idOrDoc === 'string') {
      document = this.documents.find(document => document.id === idOrDoc)
    } else {
      document = idOrDoc
    }

    if (!document) {
      return this.logger.warn('document not found', idOrDoc)
    }

    const index = this.documents.indexOf(document)
    if (index < 0) {
      return this.logger.warn('document not found', idOrDoc)
    }

    document.remove()
    this.documents.splice(index, 1)
    this.documentsMap.delete(document.id)

    this.emitter.emit(ProjectEventMap.DocumentRemove, idOrDoc)
  }

  /**
   * open or create a document
   */
  open(idOrDoc?: string | Document | DocumentSchema) {
    if (!idOrDoc) {
      this.logger.warn('no doc param found, will create a new document')
      return this.createDocument().open()
    }

    if (typeof idOrDoc === 'string') {
      const got = this.documents.find(doc => doc.id === idOrDoc)
      return got?.open()
    }
    if (isDocument(idOrDoc)) {
      return idOrDoc.open()
    }

    const newDoc = this.createDocument(idOrDoc)
    return newDoc.open()
  }

  /**
   * suspense other documents
   * @param curDoc current active document
   */
  checkExclusive(curDoc: Document) {
    for (const doc of this.documents) {
      if (doc !== curDoc) {
        doc.suspense()
      }
    }

    this.emitter.emit('current-document.change', curDoc)
  }

  getDocument(id: string) {
    return this.documents.find(doc => doc.id === id)
  }

  /**
   * set extra data, available for plugins
   */
  set<T extends keyof ProjectSchema>(key: T, value: ProjectSchema[T]): void
  set(key: string, value: unknown): void
  set(key: string, value: unknown): void {
    if (key === 'config') {
      this._config = value as Record<string, any>
    }

    Object.assign(this.data, { [key]: value })
  }

  /**
   * get extra data, available for plugins
   */
  get<T extends keyof ProjectSchema>(key: T): ProjectSchema[T]
  get<T>(key: string): T
  get(key: string): unknown
  get(key: string): any {
    if (key === 'config') {
      return this._config
    }

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
