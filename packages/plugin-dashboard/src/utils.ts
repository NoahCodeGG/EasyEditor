import type { Node } from '@easy-editor/core'

/**
 * 更新节点在 dashboard 中的位置
 * @param node 节点
 * @param offset 节点相对于画布的偏移量
 * @param groupOffset 节点相对于其父组节点的偏移量
 */
export const updateNodeRect = (node: Node, offset = { x: 0, y: 0 }, groupOffset = { x: 0, y: 0 }) => {
  if (node.isGroup) {
    const groupRect = node.getDashboardRect()

    for (const childNode of node.childrenNodes) {
      const childRect = childNode.getDashboardRect()
      // 计算 node to group 直接的偏移量
      const childRectOffset = {
        x: childRect.x - groupRect.x + groupOffset.x,
        y: childRect.y - groupRect.y + groupOffset.y,
      }

      if (childNode.isGroup) {
        updateNodeRect(childNode, offset, childRectOffset)
      } else {
        childNode.setExtraPropValue('$dashboard.rect.x', offset.x + childRectOffset.x)
        childNode.setExtraPropValue('$dashboard.rect.y', offset.y + childRectOffset.y)
      }
    }
  } else {
    node.setExtraPropValue('$dashboard.rect.x', offset.x)
    node.setExtraPropValue('$dashboard.rect.y', offset.y)
  }
}
