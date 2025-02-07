import { nanoid } from 'nanoid'

/**
 * generate a unique id
 * @param prefix a identifier prefix
 */
export const uniqueId = (prefix = '') => {
  return `${prefix}-${nanoid(12)}`
}
