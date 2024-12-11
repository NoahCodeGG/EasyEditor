import type { NodeSchema } from '@easy-editor/core'
import { logger } from './logger'

export * from './logger'

export const isSchema = (schema: any): schema is NodeSchema => {
  if (!schema) {
    return false
  }
  // Leaf and Slot should be valid
  if (schema.componentName === 'Leaf' || schema.componentName === 'Slot') {
    return true
  }
  if (Array.isArray(schema)) {
    return schema.every(item => isSchema(item))
  }
  // check if props is valid
  const isValidProps = (props: any) => {
    if (!props) {
      return false
    }
    return typeof schema.props === 'object' && !Array.isArray(props)
  }
  return !!(schema.componentName && isValidProps(schema.props))
}

export const getValue = (obj: any, path: string, defaultValue = {}) => {
  // array is not valid type, return default value
  if (Array.isArray(obj)) {
    return defaultValue
  }

  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const res = path.split('.').reduce((pre, cur) => {
    return pre && pre[cur]
  }, obj)
  if (res === undefined) {
    return defaultValue
  }
  return res
}

export function transformArrayToMap(arr: any[], key: string, overwrite = true) {
  if (!arr || !Array.isArray(arr)) {
    return {}
  }
  const res: any = {}
  arr.forEach(item => {
    const curKey = item[key]
    if (item[key] === undefined) {
      return
    }
    if (res[curKey] && !overwrite) {
      return
    }
    res[curKey] = item
  })
  return res
}

interface IParseOptions {
  thisRequiredInJSE?: boolean
  logScope?: string
}

export const parseData = (schema: unknown, self: any, options: IParseOptions = {}): any => {
  if (typeof schema === 'string') {
    return schema.trim()
  } else if (Array.isArray(schema)) {
    return schema.map(item => parseData(item, self, options))
  } else if (typeof schema === 'function') {
    return schema.bind(self)
  } else if (typeof schema === 'object') {
    // 对于undefined及null直接返回
    if (!schema) {
      return schema
    }
    const res: any = {}
    Object.entries(schema).forEach(([key, val]) => {
      if (key.startsWith('__')) {
        return
      }
      res[key] = parseData(val, self, options)
    })
    return res
  }
  return schema
}

export const isUseLoop = (loop: null | any[], isDesignMode: boolean): boolean => {
  if (!isDesignMode) {
    return true
  }

  if (!Array.isArray(loop)) {
    return false
  }

  return loop.length > 0
}

export function checkPropTypes(value: any, name: string, rule: any, componentName: string): boolean {
  let ruleFunction = rule
  if (typeof rule === 'string') {
    ruleFunction = new Function(`"use strict"; const PropTypes = arguments[0]; return ${rule}`)(PropTypes2)
  }
  if (!ruleFunction || typeof ruleFunction !== 'function') {
    logger.warn('checkPropTypes should have a function type rule argument')
    return true
  }
  const err = ruleFunction(
    {
      [name]: value,
    },
    name,
    componentName,
    'prop',
    null,
    ReactPropTypesSecret,
  )
  if (err) {
    logger.warn(err)
  }
  return !err
}
