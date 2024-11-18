/**
 * 根据 path 解析拆解
 */
export const splitPath = (path: string, levels = 0) => {
  const pathArray = path.split('.')
  const subPaths: string[] = []
  let currentPath = ''

  for (let i = 0; i < pathArray.length; i++) {
    const pathPart = pathArray[i]
    currentPath += (currentPath === '' ? '' : '.') + pathPart

    if (pathPart.includes('[')) {
      const index = Number.parseInt(pathPart.match(/\[(.*?)\]/)![1])
      const subPath = currentPath.replace(`[${index}]`, '')

      if (i === levels - 1) {
        subPaths.push(currentPath)
      } else {
        subPaths.push(subPath)
      }
    } else {
      subPaths.push(currentPath)
    }
  }

  return subPaths
}

const setCharAt = (str: string, index: number, chr: string) => {
  if (index > str.length - 1) return str
  return str.substring(0, index) + chr + str.substring(index + 1)
}

/**
 * 处理数组 path
 */
export const getArrayPath = (arrayCtx: { [key: string]: string }, name: string): string => {
  let path = name

  for (const e of Object.keys(arrayCtx)) {
    if (name.indexOf(e) !== -1) {
      path = setCharAt(name, e.length + 1, arrayCtx[e])
    }
  }

  return path
}
