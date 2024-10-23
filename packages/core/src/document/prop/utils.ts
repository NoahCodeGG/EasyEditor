/**
 * split path to entry and nest
 * - entry: a or 0
 * - nest: .b or [1].b
 */
export const splitPath = (path: string) => {
  let entry = path
  let nest = ''

  const objIndex = path.indexOf('.', 1) // path = ".c.a.b"
  const arrIndex = path.indexOf('[', 1) // path = "[0].a.b"

  if (objIndex > 0 && ((arrIndex > 0 && objIndex < arrIndex) || arrIndex < 0)) {
    entry = path.slice(0, objIndex)
    nest = path.slice(objIndex + 1)
  }

  if (arrIndex > 0 && ((objIndex > 0 && arrIndex < objIndex) || objIndex < 0)) {
    entry = path.slice(0, arrIndex)
    nest = path.slice(arrIndex)
  }
  if (entry.startsWith('[')) {
    entry = entry.slice(1, entry.length - 1)
  }

  return { entry, nest }
}

/**
 * check if the key is a valid array index
 */
export function isValidArrayIndex(key: any, limit = -1): key is number {
  const n = Number.parseFloat(String(key))
  return n >= 0 && Math.floor(n) === n && Number.isFinite(n) && (limit < 0 || n < limit)
}

export const isObject = (value: any): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object'
}

export const isPlainObject = (value: any): value is any => {
  if (!isObject(value)) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null || Object.getPrototypeOf(proto) === null
}
