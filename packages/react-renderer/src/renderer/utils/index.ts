import type { NodeSchema } from '@easy-editor/core'

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
