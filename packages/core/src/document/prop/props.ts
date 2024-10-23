import type { Node } from '../node/node'

import { createLogger } from '@/utils'
import { action, computed, observable } from 'mobx'
import { Prop, UNSET } from './prop'
import { splitPath } from './utils'

export interface PropsSchema {
  [key: string]: any
}

const EXTRA_KEY_PREFIX = '__'

/**
 * prop key convert to extra key
 */
const getConvertedExtraKey = (key: string): string => {
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
const getOriginalExtraKey = (key: string): string => {
  return key.replace(new RegExp(`${EXTRA_KEY_PREFIX}`, 'g'), '')
}

const isExtraKey = (key: string): boolean => {
  return key.startsWith(EXTRA_KEY_PREFIX) && key.endsWith(EXTRA_KEY_PREFIX)
}

export class Props {
  private logger = createLogger('Props')

  readonly path = []

  get props() {
    return this
  }

  @observable.shallow items: Prop[] = []

  private _maps = new Map<string, Prop>()

  get maps() {
    return this._maps
  }

  @computed get size() {
    return this.items.length
  }

  constructor(
    readonly owner: Node,
    props?: PropsSchema,
    extras?: PropsSchema,
  ) {
    this.import(props, extras)
  }

  @action
  import(props?: PropsSchema, extras?: PropsSchema) {
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

  /**
   * get a prop, if not found, create a prop when createIfNone is true
   */
  private get(path: string, createIfNone = false) {
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

  query(path: string, createIfNone = true) {
    return this.get(path, createIfNone)
  }

  getProp(path: string, createIfNone = true) {
    return this.query(path, createIfNone) || null
  }

  getPropValue(path: string) {
    return this.getProp(path, false)?.value
  }

  @action
  setPropValue(path: string, value: any) {
    this.getProp(path, true)!.setValue(value)
  }

  @action
  delete(propKey: Prop | string) {
    let prop: Prop | undefined
    if (typeof propKey === 'string') {
      prop = this.items.find(item => item.key === propKey)
    } else {
      prop = propKey
    }

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
  add(key: string, value?: any) {
    const prop = new Prop(this, key, value)
    this.items.push(prop)
    return prop
  }

  has(key: string) {
    return this.maps.has(key)
  }

  forEach(fn: (item: Prop, key: string) => void) {
    for (const item of this.items) {
      fn(item, item.key)
    }
  }

  map<E>(fn: (item: Prop, key: string) => E): E[] | null {
    return this.items.map(item => {
      return fn(item, item.key)
    })
  }

  filter(fn: (item: Prop, key: string) => boolean) {
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
