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
