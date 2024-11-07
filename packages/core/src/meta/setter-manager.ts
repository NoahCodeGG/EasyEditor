import { action } from 'mobx'
import { createLogger } from '../utils'
import type { Component } from './meta'

export interface Setter {
  component: Component
  defaultProps?: object
  title?: string
  /**
   * for MixedSetter to check this setter if available
   */
  condition?: (field: any) => boolean
  /**
   * for MixedSetter to manual change to this setter
   */
  initialValue?: any | ((field: any) => any)
  recommend?: boolean
  // 标识是否为动态 setter，默认为 true
  isDynamic?: boolean
}

interface RegisterSetterOption {
  overwrite?: boolean
}

export class SetterManager {
  private logger = createLogger('Setters')

  settersMap = new Map<
    string,
    Setter & {
      type: string
    }
  >()

  getSetter = (type: string): Setter | null => {
    return this.settersMap.get(type) || null
  }

  @action
  registerSetter = (type: string, setter: Component | Setter, option?: RegisterSetterOption) => {
    if (this.settersMap.has(type) && !option?.overwrite) {
      this.logger.error(`SetterManager register error! The setter (${setter.name}) has already been registered!`)
      return
    }

    // TODO: 判断组件
    // if (isCustomView(setter)) {
    const newSetter = {
      component: setter,
      title: (setter as any).displayName || (setter as any).name || 'CustomSetter',
    }
    this.settersMap.set(type, { type, ...newSetter })
  }

  registerSettersMap = (maps: Record<string, Setter>) => {
    Object.keys(maps).forEach(type => {
      this.registerSetter(type, maps[type])
    })
  }

  getSettersMap = () => {
    return this.settersMap
  }
}
