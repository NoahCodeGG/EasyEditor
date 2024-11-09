import type { Component } from './meta'

import { action } from 'mobx'
import { createLogger } from '../utils'

/** for setter component props */
export interface SetterProps<T = unknown> {
  value: T
  onChange: (val: T) => void
}

export interface Setter {
  component: Component
  defaultProps?: object
  name?: string
  // condition?: (field: any) => boolean
  // initialValue?: any | ((field: any) => any)
}

interface RegisterSetterOption {
  overwrite?: boolean
}

export class SetterManager {
  private logger = createLogger('Setters')

  private _settersMap = new Map<
    string,
    Setter & {
      type: string
    }
  >()

  getSetter(type: string) {
    return this._settersMap.get(type)
  }

  @action
  registerSetter(type: string, setter: Component | Setter, option?: RegisterSetterOption) {
    if (this._settersMap.has(type) && !option?.overwrite) {
      this.logger.error(`SetterManager register error! The setter (${setter.name}) has already been registered!`)
      return
    }

    const newSetter = {
      component: setter,
      title: (setter as Component).displayName || (setter as Setter).name || type,
    }
    this._settersMap.set(type, { type, ...newSetter })
  }

  registerSettersMap = (maps: Record<string, Setter>) => {
    Object.keys(maps).forEach(type => {
      this.registerSetter(type, maps[type])
    })
  }

  get settersMap() {
    return this._settersMap
  }
}
