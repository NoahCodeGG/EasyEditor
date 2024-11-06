import type { Node } from '../node/node'
import type { PropKey, PropValue } from './prop'

import { action, computed, observable } from 'mobx'
import { createLogger, uniqueId } from '../../utils'
import { Prop, UNSET, splitPath } from './prop'

export interface PropsSchema {
  [key: PropKey]: any
}

const EXTRA_KEY_PREFIX = '__'

/**
 * prop key convert to extra key
 */
export const getConvertedExtraKey = (key: PropKey): string => {
  if (!key) {
    return ''
  }
  let _key = key
  if (key.indexOf('.') > 0) {
    _key = key.split('.')[0]
  }
  return EXTRA_KEY_PREFIX + _key + EXTRA_KEY_PREFIX + key.slice(_key.length)
}

/**
 * extra key convert to prop key
 */
export const getOriginalExtraKey = (key: PropKey): string => {
  return key.replace(new RegExp(`${EXTRA_KEY_PREFIX}`, 'g'), '')
}

export const isExtraKey = (key: PropKey): boolean => {
  return key.startsWith(EXTRA_KEY_PREFIX) && key.endsWith(EXTRA_KEY_PREFIX)
}

export class Props {
  private logger = createLogger('Props')

  readonly id = uniqueId('props')

  readonly path = []

  get props() {
    return this
  }

  readonly owner: Node

  getProps() {
    return this.props
  }

  getNode() {
    return this.owner
  }

  @observable.shallow accessor items: Prop[] = []

  @computed private get maps() {
    const maps = new Map<string, Prop>()

    if (this.items.length > 0) {
      this.items.forEach(prop => {
        if (prop.key) {
          maps.set(prop.key, prop)
        }
      })
    }

    return maps
  }

  @computed get size() {
    return this.items.length
  }

  constructor(owner: Node, props?: PropsSchema, extras?: PropsSchema) {
    this.owner = owner
    this.import(props, extras)
  }

  @action
  import(props?: PropsSchema, extras?: PropsSchema) {
    // TODO: 是否需要继承之前相同的 key，来保持响应式
    this.purge()

    if (props) {
      this.items = Object.keys(props).map(key => new Prop(this, key, props[key]))
    }
    if (extras) {
      this.items.push(...Object.keys(extras).map(key => new Prop(this, getConvertedExtraKey(key), extras[key])))
    }
  }

  export() {
    if (this.items.length < 1) {
      return {}
    }

    const props: PropsSchema = {}
    const extras: PropsSchema = {}

    for (const item of this.items) {
      const key = item.key as string
      const value = item.export()

      if (isExtraKey(key)) {
        extras[getOriginalExtraKey(key)] = value
      } else {
        props[key] = value
      }
    }

    return { props, extras }
  }

  private purged = false

  @action
  purge() {
    if (this.purged) {
      return
    }
    this.purged = true
    for (const item of this.items) {
      item.purge()
    }
  }

  /**
   * get a prop, if not found, create a prop when createIfNone is true
   */
  get(path: PropKey, createIfNone = false) {
    const { entry, nest } = splitPath(path)

    let prop = this.maps.get(entry)
    if (!prop && createIfNone) {
      prop = this.add(entry, UNSET)
    }

    if (prop) {
      return nest ? prop.get(nest, createIfNone) : prop
    }

    return null
  }

  query(path: PropKey, createIfNone = true) {
    return this.get(path, createIfNone)
  }

  getProp(path: PropKey, createIfNone = true) {
    return this.query(path, createIfNone) || null
  }

  getPropValue(path: PropKey) {
    return this.getProp(path, false)?.value
  }

  @action
  setPropValue(path: PropKey, value: any) {
    this.getProp(path, true)!.setValue(value)
  }

  @action
  delete(prop: Prop) {
    const index = this.items.indexOf(prop)
    if (index > -1) {
      this.items.splice(index, 1)
      prop.purge()
    }
  }

  @action
  deleteKey(propKey: PropKey) {
    const prop = this.maps.get(propKey)
    if (!prop) {
      return this.logger.warn(`prop ${propKey} not found`)
    }

    const index = this.items.indexOf(prop)
    if (index > -1) {
      this.items.splice(index, 1)
      prop.purge()
    }
  }

  @action
  add(key: PropKey, value?: PropValue) {
    const prop = new Prop(this, key, value)
    this.items.push(prop)
    return prop
  }

  has(key: PropKey) {
    return this.maps.has(key)
  }

  forEach(fn: (item: Prop, key: PropKey) => void) {
    for (const item of this.items) {
      fn(item, item.key)
    }
  }

  map<E>(fn: (item: Prop, key: PropKey) => E): E[] | null {
    return this.items.map(item => {
      return fn(item, item.key)
    })
  }

  filter(fn: (item: Prop, key: PropKey) => boolean) {
    return this.items.filter(item => {
      return fn(item, item.key)
    })
  }

  [Symbol.iterator](): { next(): { value: Prop } } {
    let index = 0
    const { items } = this
    const length = items.length || 0

    return {
      next() {
        if (index < length) {
          return {
            value: items[index++],
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
