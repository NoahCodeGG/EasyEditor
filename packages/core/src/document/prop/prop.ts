import { createLogger, uniqueId } from '@/utils'
import { action, computed, observable, runInAction, untracked } from 'mobx'
import type { Node } from '../node/node'
import type { Props } from './props'
import { splitPath } from './utils'

export const UNSET = Symbol.for('unset')
export type UNSET = typeof UNSET

export type ValueTypes = 'unset' | 'literal' | 'map' | 'list' | 'slot'

export class Prop {
  private logger = createLogger('Prop')

  @observable.ref id: string

  @observable.ref key: string

  @observable.ref owner: Node

  @observable.ref props: Props

  @observable.ref private _value: unknown = UNSET

  @observable.ref private _type: ValueTypes = 'unset'

  get type(): ValueTypes {
    return this._type
  }

  @observable.shallow private _items: Prop[] | null = null

  @observable.shallow private _maps: Map<string | number, Prop> | null = null

  private get items(): Prop[] | null {
    if (this._items) return this._items
    return runInAction(() => {
      let items: Prop[] | null = null
      if (this._type === 'list') {
        const data = this._value
        data.forEach((item: any, idx: number) => {
          items = items || []
          items.push(new Prop(this, item, idx))
        })
        this._maps = null
      } else if (this._type === 'map') {
        const data = this._value
        const maps = new Map<string, Prop>()
        const keys = Object.keys(data)
        for (const key of keys) {
          let prop: Prop
          if (this._prevMaps?.has(key)) {
            prop = this._prevMaps.get(key)!
            prop.setValue(data[key])
          } else {
            prop = new Prop(this, data[key], key)
          }
          items = items || []
          items.push(prop)
          maps.set(key, prop)
        }
        this._maps = maps
      } else {
        items = null
        this._maps = null
      }
      this._items = items
      return this._items
    })
  }

  @computed private get maps(): Map<string | number, Prop> | null {
    if (!this.items) {
      return null
    }
    return this._maps
  }

  get path(): string[] {
    return (this.parent.path || []).concat(this.key as string)
  }

  /**
   * 元素个数
   */
  get size(): number {
    return this.items?.length || 0
  }

  constructor(
    readonly parent: Prop,
    key: string,
    value?: unknown,
  ) {
    this.owner = parent.owner
    this.props = parent.props
    this.id = uniqueId()
    this.key = key
    this.value = value
  }

  export() {
    const type = this._type

    if (type === 'unset') {
      return undefined
    }

    if (type === 'literal') {
      return this._value
    }

    if (type === 'map') {
      if (!this._items) {
        return this._value
      }
      let maps: any
      this.items!.forEach((prop, key) => {
        if (!prop.isUnset()) {
          const v = prop.export()
          if (v != null) {
            maps = maps || {}
            maps[prop.key || key] = v
          }
        }
      })
      return maps
    }

    if (type === 'list') {
      if (!this._items) {
        return this._value
      }
      const values = this.items!.map(prop => {
        return prop.export()
      })
      if (values.every(val => val === undefined)) {
        return undefined
      }
      return values
    }
  }

  @action
  remove() {
    this.parent.delete(this)
  }

  @action
  purge() {
    if (this.purged) {
      return
    }
    this.purged = true
    if (this._items) {
      this._items.forEach(item => item.purge())
    }
    this._items = null
    this._maps = null
    // @ts-ignore
    if (this._slotNode && this._slotNode.slotFor === this) {
      // @ts-ignore
      this._slotNode.remove()
    }
  }

  @action
  private dispose() {
    const items = untracked(() => this._items)
    if (items) {
      for (const prop of items) {
        prop.purge()
      }
    }
    this._items = null
    this._prevMaps = this._maps
    this._maps = null
  }

  get(path: string, createIfNone = true): Prop | null {
    const type = this._type
    if (type !== 'map' && type !== 'list' && type !== 'unset' && !createIfNone) {
      return null
    }

    const maps = type === 'map' ? this.maps : null
    const items = type === 'list' ? this.items : null

    const { entry, nest } = splitPath(path)

    let prop: any
    if (type === 'list') {
      if (isValidArrayIndex(entry, this.size)) {
        prop = items![entry]
      }
    } else if (type === 'map') {
      prop = maps?.get(entry)
    }

    if (prop) {
      return nest ? prop.get(nest, createIfNone) : prop
    }

    if (createIfNone) {
      prop = new Prop(this, UNSET, entry)
      this.set(entry, prop, true)
      if (nest) {
        return prop.get(nest, true)
      }

      return prop
    }

    return null
  }

  @action
  set(key: string | number, value: IPublicTypeCompositeValue | Prop, force = false) {
    const type = this._type
    if (type !== 'map' && type !== 'list' && type !== 'unset' && !force) {
      return null
    }
    if (type === 'unset' || (force && type !== 'map')) {
      if (isValidArrayIndex(key)) {
        if (type !== 'list') {
          this.setValue([])
        }
      } else {
        this.setValue({})
      }
    }
    const prop = isProp(value) ? value : new Prop(this, value, key)
    const items = this._items! || []
    if (this.type === 'list') {
      if (!isValidArrayIndex(key)) {
        return null
      }
      if (isObservableArray(items)) {
        mobxSet(items, key, prop)
      } else {
        items[key] = prop
      }
      this._items = items
    } else if (this.type === 'map') {
      const maps = this._maps || new Map<string, Prop>()
      const orig = maps?.get(key)
      if (orig) {
        // replace
        const i = items.indexOf(orig)
        if (i > -1) {
          items.splice(i, 1, prop)[0].purge()
        }
        maps?.set(key, prop)
      } else {
        // push
        items.push(prop)
        this._items = items
        maps?.set(key, prop)
      }
      this._maps = maps
    } /* istanbul ignore next */ else {
      return null
    }

    return prop
  }

  @action
  delete(prop: Prop): void {
    /* istanbul ignore else */
    if (this._items) {
      const i = this._items.indexOf(prop)
      if (i > -1) {
        this._items.splice(i, 1)
        prop.purge()
      }
      if (this._maps && prop.key) {
        this._maps.delete(String(prop.key))
      }
    }
  }

  @action
  add(value: any, force = false): Prop | null {
    const type = this._type
    if (type !== 'list' && type !== 'unset' && !force) {
      return null
    }
    if (type === 'unset' || (force && type !== 'list')) {
      this.setValue([])
    }
    const prop = new Prop(this, value)
    this._items = this._items || []
    this._items.push(prop)
    return prop
  }

  has(key: string): boolean {
    if (this._type !== 'map') {
      return false
    }
    if (this._maps) {
      return this._maps.has(key)
    }
    return Object.prototype.hasOwnProperty.call(this._value, key)
  }

  @action
  deleteKey(key: string): void {
    /* istanbul ignore else */
    if (this.maps) {
      const prop = this.maps.get(key)
      if (prop) {
        this.delete(prop)
      }
    }
  }

  getAsString(): string {
    if (this.type === 'literal') {
      return this._value ? String(this._value) : ''
    }
    return ''
  }

  /**
   * set value, val should be JSON Object
   */
  @action
  setValue(val: any) {
    if (val === this._value) return
    // const editor = this.owner.document?.designer.editor;
    const oldValue = this._value
    this._value = val
    const t = typeof val
    if (val == null) {
      // this._value = undefined;
      this._type = 'literal'
    } else if (t === 'string' || t === 'number' || t === 'boolean') {
      this._type = 'literal'
    } else if (Array.isArray(val)) {
      this._type = 'list'
    } else if (isPlainObject(val)) {
      this._type = 'map'
    }
    this.dispose()
  }

  getValue() {
    return this.export()
  }

  @action
  unset() {
    this._type = 'unset'
  }

  isUnset() {
    return this._type === 'unset'
  }

  @action
  forEach(fn: (item: Prop, key: number | string | undefined) => void): void {
    const { items } = this
    if (!items) {
      return
    }
    const isMap = this._type === 'map'
    items.forEach((item, index) => {
      return isMap ? fn(item, item.key) : fn(item, index)
    })
  }

  @action
  map<T>(fn: (item: Prop, key: number | string | undefined) => T): T[] | null {
    const { items } = this
    if (!items) {
      return null
    }
    const isMap = this._type === 'map'
    return items.map((item, index) => {
      return isMap ? fn(item, item.key) : fn(item, index)
    })
  }

  [Symbol.iterator](): { next(): { value: Prop } } {
    let index = 0
    const { items } = this
    const length = items?.length || 0
    return {
      next() {
        if (index < length) {
          return {
            value: items![index++],
            done: false,
          }
        }
        return {
          value: undefined as any,
          done: true,
        }
      },
    }
  }
}
