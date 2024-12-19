import type { Node } from '@easy-editor/core'

/**
 * 更新节点在 dashboard 中的位置
 * @param node 节点
 * @param offset 节点相对于画布的偏移量
 * @param groupOffset 节点相对于其父组节点的偏移量
 */
export const updateNodeRect = (node: Node, offset = { x: 0, y: 0 }) => {
  if (node.isGroup) {
    for (const childNode of node.getAllNodesInGroup()) {
      if (!childNode.isGroup) {
        childNode.setExtraPropValue(
          '$dashboard.rect.x',
          (childNode.getExtraPropValue('$dashboard.rect.x') as number) + offset.x,
        )
        childNode.setExtraPropValue(
          '$dashboard.rect.y',
          (childNode.getExtraPropValue('$dashboard.rect.y') as number) + offset.y,
        )
      }
    }
  } else {
    node.setExtraPropValue('$dashboard.rect.x', offset.x)
    node.setExtraPropValue('$dashboard.rect.y', offset.y)
  }
}

/**
 * 更新节点 DOM 在 dashboard 中的位置
 * @param node 节点
 * @param offset 节点相对于画布的偏移量
 * @param groupOffset 节点相对于其父组节点的偏移量
 */
export const updateNodeRectByDOM = (node: Node, offset = { x: 0, y: 0 }) => {
  // 此处的 container 对应 hoc 的 container
  const domNode = document.getElementById(`${node.id}-mask`)
  if (domNode) {
    domNode.style.left = `${offset.x}px`
    domNode.style.top = `${offset.y}px`
  }
}
