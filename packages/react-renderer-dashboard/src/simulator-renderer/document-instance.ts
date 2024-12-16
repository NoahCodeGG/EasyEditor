import { type Document, type Node, TRANSFORM_STAGE, isElement } from '@easy-editor/core'
import { computed, observable } from 'mobx'
import type { ReactInstance } from 'react'
import type { SimulatorRenderer } from './simulator-renderer'

export class DocumentInstance {
  instancesMap = new Map<string, ReactInstance[]>()

  get schema(): any {
    return this.document.export(TRANSFORM_STAGE.RENDER)
  }

  private disposeFunctions: Array<() => void> = []

  @observable.ref private accessor _components: any = {}

  @computed
  get components(): object {
    // 根据 device 选择不同组件，进行响应式
    // 更好的做法是，根据 device 选择加载不同的组件资源，甚至是 simulatorUrl
    return this._components
  }

  // context from: utils、constants、history、location、match
  @observable.ref private accessor _appContext = {}

  @computed
  get context(): any {
    return this._appContext
  }

  @observable.ref private accessor _designMode = 'design'

  @computed
  get designMode(): any {
    return this._designMode
  }

  @observable.ref private accessor _requestHandlersMap = null

  @computed
  get requestHandlersMap(): any {
    return this._requestHandlersMap
  }

  @observable.ref private accessor _device = 'default'

  @computed
  get device() {
    return this._device
  }

  @observable.ref private accessor _componentsMap = {}

  @computed
  get componentsMap(): any {
    return this._componentsMap
  }

  @computed
  get suspended(): any {
    return false
  }

  @computed
  get scope(): any {
    return null
  }

  get path(): string {
    return `/${this.document.fileName}`
  }

  get id() {
    return this.document.id
  }

  get host() {
    return this.document.simulator!
  }

  constructor(
    readonly container: SimulatorRenderer,
    readonly document: Document,
  ) {}

  private unmountInstance(id: string, instance: ReactInstance) {
    const instances = this.instancesMap.get(id)
    if (instances) {
      const i = instances.indexOf(instance)
      if (i > -1) {
        instances.splice(i, 1)
        this.host.setInstance(this.document.id, id, instances)
      }
    }
  }

  mountInstance(id: string, instance: ReactInstance | null) {
    const docId = this.document.id
    const { instancesMap } = this
    if (instance == null) {
      let instances = this.instancesMap.get(id)
      if (instances) {
        instances = instances.filter(checkInstanceMounted)
        if (instances.length > 0) {
          instancesMap.set(id, instances)
          this.host.setInstance(this.document.id, id, instances)
        } else {
          instancesMap.delete(id)
          this.host.setInstance(this.document.id, id, null)
        }
      }
      return
    }
    const unmountInstance = this.unmountInstance.bind(this)
    const origId = (instance as any)[SYMBOL_VNID]
    if (origId && origId !== id) {
      // 另外一个节点的 instance 在此被复用了，需要从原来地方卸载
      unmountInstance(origId, instance)
    }
    if (isElement(instance)) {
      cacheReactKey(instance)
    } else if (origId !== id) {
      // 涵盖 origId == null || origId !== id 的情况
      let origUnmount: any = instance.componentWillUnmount
      if (origUnmount && origUnmount.origUnmount) {
        origUnmount = origUnmount.origUnmount
      }
      // hack! delete instance from map
      const newUnmount = function (this: any) {
        unmountInstance(id, instance)
        origUnmount && origUnmount.call(this)
      }
      ;(newUnmount as any).origUnmount = origUnmount
      instance.componentWillUnmount = newUnmount
    }
    ;(instance as any)[SYMBOL_VNID] = id
    ;(instance as any)[SYMBOL_VDID] = docId
    let instances = this.instancesMap.get(id)
    if (instances) {
      const l = instances.length
      instances = instances.filter(checkInstanceMounted)
      let updated = instances.length !== l
      if (!instances.includes(instance)) {
        instances.push(instance)
        updated = true
      }
      if (!updated) {
        return
      }
    } else {
      instances = [instance]
    }
    instancesMap.set(id, instances)
    this.host.setInstance(this.document.id, id, instances)
  }

  mountContext() {}

  getNode(id: string): Node | null {
    return this.document.getNode(id)
  }

  dispose() {
    this.disposeFunctions.forEach(fn => fn())
    this.instancesMap = new Map()
  }
}

export const SYMBOL_VNID = Symbol('_LCNodeId')
export const SYMBOL_VDID = Symbol('_LCDocId')

export let REACT_KEY = ''
export const cacheReactKey = (el: Element): Element => {
  if (REACT_KEY !== '') {
    return el
  }
  // react17 采用 __reactFiber 开头
  REACT_KEY =
    Object.keys(el).find(key => key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) || ''
  if (!REACT_KEY && (el as HTMLElement).parentElement) {
    return cacheReactKey((el as HTMLElement).parentElement!)
  }
  return el
}

function checkInstanceMounted(instance: any): boolean {
  if (isElement(instance)) {
    return instance.parentElement != null
  }
  return true
}
