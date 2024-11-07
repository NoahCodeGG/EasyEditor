import { action, computed, observable } from 'mobx'
import type { Designer } from '../designer'
import type { Editor } from '../editor'
import { ComponentMeta, isComponentMeta } from './component-meta'
import type { Component, ComponentMetadata } from './meta'

export class ComponentMetaManager {
  @observable.ref private accessor _componentMetasMap = new Map<string, ComponentMeta>()

  private _lostComponentMetasMap = new Map<string, ComponentMeta>()

  get designer() {
    return this.editor.get('designer') as Designer
  }

  constructor(readonly editor: Editor) {}

  buildComponentMetasMap(metas: ComponentMetadata[]) {
    metas.forEach(data => this.createComponentMeta(data))
  }

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

  @action
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

  getComponentMetasMap() {
    return this._componentMetasMap
  }

  @computed get componentMetasMap(): { [key: string]: Component } {
    const maps: any = {}
    this._componentMetasMap.forEach((config, key) => {
      const metaData = config.getMetadata()
      // if (metaData.devMode === 'lowCode') {
      maps[key] = metaData
      // }
    })
    return maps
  }

  isComponentMeta(obj: any) {
    return isComponentMeta(obj)
  }
}
