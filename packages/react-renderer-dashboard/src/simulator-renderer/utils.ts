import { type ProjectSchema, isElement } from '@easy-editor/core'
import type { ComponentType } from 'react'

export type Component = ComponentType<any> | object

export const buildComponents = (
  libraryMap: Record<string, any>,
  componentsMap: { [componentName: string]: ComponentType<any> },
  createComponent?: (schema: ProjectSchema) => Component | null,
) => {
  const components: any = {}
  Object.keys(componentsMap).forEach(componentName => {
    const component = componentsMap[componentName]
    components[componentName] = component
  })
  return components
}

// a range for test TextNode clientRect
const cycleRange = document.createRange()

export function getClientRects(node: Element | Text) {
  if (isElement(node)) {
    return [node.getBoundingClientRect()]
  }

  cycleRange.selectNode(node)
  return Array.from(cycleRange.getClientRects())
}
