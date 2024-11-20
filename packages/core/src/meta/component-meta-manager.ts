import type { Designer } from '../designer'
import type { Editor } from '../editor'
import type { ComponentMetadata } from './meta'

import { action, computed, observable } from 'mobx'
import { ComponentMeta, isComponentMeta } from './component-meta'

export class ComponentMetaManager {
  @observable.ref private accessor _componentMetasMap = new Map<string, ComponentMeta>()

  private _lostComponentMetasMap = new Map<string, ComponentMeta>()

  get designer() {
    return this.editor.get('designer') as Designer
  }

  constructor(readonly editor: Editor) {}

  @action
  createComponentMeta(data: ComponentMetadata) {
    const key = data.componentName
    if (!key) {
      return null
    }
    let meta = this._componentMetasMap.get(key)
    if (meta) {
      meta.setMetadata(data)

      this._componentMetasMap.set(key, meta)
    } else {
      meta = this._lostComponentMetasMap.get(key)

      if (meta) {
        meta.setMetadata(data)
        this._lostComponentMetasMap.delete(key)
      } else {
        meta = new ComponentMeta(this.designer, data)
      }

      this._componentMetasMap.set(key, meta)
    }

    return meta
  }

  createComponentMetaMap = (maps: Record<string, ComponentMetadata>) => {
    Object.keys(maps).forEach(type => {
      this.createComponentMeta(maps[type])
    })
  }

  getComponentMeta(componentName: string, generateMetadata?: () => ComponentMetadata | null): ComponentMeta {
    if (this._componentMetasMap.has(componentName)) {
      return this._componentMetasMap.get(componentName)!
    }

    if (this._lostComponentMetasMap.has(componentName)) {
      return this._lostComponentMetasMap.get(componentName)!
    }

    const meta = new ComponentMeta(this.designer, {
      componentName,
      ...(generateMetadata ? generateMetadata() : null),
    })

    this._lostComponentMetasMap.set(componentName, meta)

    return meta
  }

  getComponentSnippets() {
    return Array.from(this._componentMetasMap.values()).flatMap(meta => meta.snippets)
  }

  @computed get componentMetasMap() {
    const maps: Record<string, ComponentMetadata> = {}
    this._componentMetasMap.forEach((config, key) => {
      const metaData = config.getMetadata()
      maps[key] = metaData
    })
    return maps
  }

  isComponentMeta(obj: any) {
    return isComponentMeta(obj)
  }
}
