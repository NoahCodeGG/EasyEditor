import {
  type ComponentInstance,
  DESIGNER_EVENT,
  type Document,
  DragObjectType,
  type DropLocation,
  type Node,
  type PluginCreator,
  type Simulator,
  getConvertedExtraKey,
} from '@easy-editor/core'
import { GroupComponent, GroupComponentMeta } from './materials/group'
import { updateNodeRect, updateNodeRectByDOM } from './utils'

interface DashboardPluginOptions {
  dndMode?: 'props' | 'dom'

  // TODO: 配置分组内容(schema、meta)
  xxx?: string
}

const groupSchema = {
  componentName: 'Group',
  title: '分组',
  isGroup: true,
}

const DashboardPlugin: PluginCreator<DashboardPluginOptions> = options => {
  const { dndMode = 'dom' } = options || {}

  return {
    name: 'DashboardPlugin',
    deps: [],
    init(ctx) {
      const { designer, simulator, componentMetaManager } = ctx

      // add componentMeta
      componentMetaManager.createComponentMeta(GroupComponentMeta)
      simulator.addComponent('Group', GroupComponent)

      /* ---------------------------- NodeData to Node ---------------------------- */
      const startOffsetNodeData = { x: 0, y: 0 }

      designer.dragon.onDragstart(e => {
        const { dragObject } = e

        if (dragObject && dragObject.type === DragObjectType.NodeData) {
          startOffsetNodeData.x = e.globalX! - e.target!.offsetLeft
          startOffsetNodeData.y = e.globalY! - e.target!.offsetTop
        }
      })

      designer.onEvent(DESIGNER_EVENT.INSERT_NODE_BEFORE, (e: DropLocation) => {
        const { event } = e
        const { dragObject } = event

        // add dashboard rect
        if (dragObject && dragObject.type === DragObjectType.NodeData) {
          const nodeData = Array.isArray(dragObject.data) ? dragObject.data : [dragObject.data]
          for (const schema of nodeData) {
            if (!schema) continue
            if (!schema.$dashboard) {
              schema.$dashboard = {}
            }
            if (!schema.$dashboard.rect) {
              schema.$dashboard.rect = {}
            }
            schema.$dashboard.rect.x = event.canvasX! - startOffsetNodeData.x
            schema.$dashboard.rect.y = event.canvasY! - startOffsetNodeData.y
          }
        }
      })

      /* ----------------------------------- DND ---------------------------------- */
      let startNodes: { [key: string]: { x: number; y: number } } = {}
      let startOffsetNodes: { [key: string]: { x: number; y: number } } = {}

      designer.dragon.onDragstart(e => {
        const { dragObject } = e

        if (dragObject && dragObject.type === DragObjectType.Node) {
          for (const node of dragObject.nodes!) {
            if (!node) continue

            // 计算鼠标偏移量
            const rect = node.getDashboardRect()
            if (rect) {
              startNodes[node.id] = rect
              startOffsetNodes[node.id] = { x: e.canvasX! - rect.x, y: e.canvasY! - rect.y }
            }
          }
        }
      })

      designer.dragon.onDrag(e => {
        const { dragObject } = e
        if (dragObject && dragObject.type === DragObjectType.Node) {
          for (const node of dragObject.nodes!) {
            if (!node) continue

            // 更新节点位置
            if (dndMode === 'dom') {
              const { x = 0, y = 0 } = startOffsetNodes[node.id]
              updateNodeRectByDOM(node, { x: e.canvasX! - x, y: e.canvasY! - y })
            } else if (dndMode === 'props') {
              const { x = 0, y = 0 } = startOffsetNodes[node.id]
              const { x: startX = 0, y: startY = 0 } = startNodes[node.id]
              if (node.isGroup) {
                updateNodeRect(node, { x: e.canvasX! - x - startX, y: e.canvasY! - y - startY })
              } else {
                updateNodeRect(node, { x: e.canvasX! - x, y: e.canvasY! - y })
              }
              startNodes[node.id] = node.getDashboardRect()
            }
          }
        }
      })

      designer.dragon.onDragend(e => {
        const { dragObject } = e
        if (dragObject && dragObject.type === DragObjectType.Node) {
          for (const node of dragObject.nodes!) {
            if (!node) continue

            if (dndMode === 'dom') {
              const { x = 0, y = 0 } = startOffsetNodes[node.id]
              const { x: startX = 0, y: startY = 0 } = startNodes[node.id]
              if (node.isGroup) {
                updateNodeRect(node, { x: e.canvasX! - x - startX, y: e.canvasY! - y - startY })
              } else {
                updateNodeRect(node, { x: e.canvasX! - x, y: e.canvasY! - y })
              }
            }
          }
        }

        startNodes = {}
        startOffsetNodes = {}
      })
    },
    extend(ctx) {
      const { Document, Node, Simulator } = ctx

      Object.defineProperties(Document.prototype, {
        group: {
          value(this: Document, nodeIdList: Node[] | string[]) {
            if (nodeIdList.length === 0) return

            let nodeList: Node[] = []
            if (typeof nodeIdList[0] === 'string') {
              nodeList = (nodeIdList as string[]).map(id => this.getNode(id)!)
            }

            const groupNode = this.createNode(groupSchema)

            // 计算所有节点的 index，确定分组的插入位置
            let maxZIndex = Number.POSITIVE_INFINITY
            for (const node of nodeList) {
              if (node.index < maxZIndex) {
                maxZIndex = node.index
              }
              if (node && !node.isRoot) {
                this.migrateNode(node, groupNode)
              }
            }

            this.rootNode?.insert(groupNode, maxZIndex)

            return groupNode
          },
        },
        ungroup: {
          value(this: Document, group: Node | string) {
            let groupNode: Node | null
            if (typeof group === 'string') {
              groupNode = this.getNode(group)
            } else {
              groupNode = group
            }

            if (!groupNode || !groupNode.isGroup || !groupNode.children) return

            const nodes = groupNode.childrenNodes
            // TODO: 这里写法很奇怪，因为children是响应式的，所以迁移之后，children也会更新
            while (nodes.length > 0) {
              if (groupNode.parent) {
                this.migrateNode(nodes[0], groupNode.parent)
              }
            }

            this.removeNode(groupNode)
          },
        },
      })

      const originalInitProps = Node.prototype.initBuiltinProps
      Object.defineProperties(Node.prototype, {
        getDashboardRect: {
          value(this: Node) {
            if (!this.isGroup) return this.getExtraPropValue('$dashboard.rect')

            let [minX, minY, maxX, maxY] = [
              Number.POSITIVE_INFINITY,
              Number.POSITIVE_INFINITY,
              Number.NEGATIVE_INFINITY,
              Number.NEGATIVE_INFINITY,
            ]

            for (const child of this.childrenNodes) {
              let childRect: any
              if (child.isGroup) {
                childRect = child.getDashboardRect()
              } else {
                childRect = child.getExtraPropValue('$dashboard.rect')
              }

              minX = Math.min(minX, childRect.x)
              minY = Math.min(minY, childRect.y)
              maxX = Math.max(maxX, childRect.x + childRect.width)
              maxY = Math.max(maxY, childRect.y + childRect.height)
            }

            return new DOMRect(minX, minY, maxX - minX, maxY - minY)
          },
        },
        isGroup: {
          get(this: Node) {
            return this.getExtraPropValue('isGroup')
          },
        },
        getCurrentGroup: {
          value(this: Node) {
            let parent = this.parent
            while (parent && !parent.isGroup) {
              parent = parent.parent
            }
            return parent
          },
        },
        getTopGroup: {
          value(this: Node) {
            let parent = this.parent
            let topGroup: Node | null = null
            while (parent) {
              if (parent.isGroup) {
                topGroup = parent
              }
              parent = parent.parent
            }
            return topGroup
          },
        },
        getAllGroups: {
          value(this: Node) {
            const groups: Node[] = []
            let parent = this.parent
            while (parent) {
              if (parent.isGroup) {
                groups.push(parent)
              }
              parent = parent.parent
            }
            return groups
          },
        },
        getNodesInGroup: {
          value(this: Node) {
            if (!this.isGroup) return []

            const nodes: Node[] = []
            for (const node of this.childrenNodes) {
              if (!node.isGroup) {
                nodes.push(node)
              }
            }
            return nodes
          },
        },
        getAllNodesInGroup: {
          value(this: Node) {
            if (!this.isGroup) return []

            const nodes: Node[] = []
            for (const node of this.childrenNodes) {
              if (node.isGroup) {
                nodes.push(...node.getAllNodesInGroup())
              } else {
                nodes.push(node)
              }
            }
            return nodes
          },
        },
        // override
        initBuiltinProps: {
          value(this: Node) {
            // 实现类似 super.initBuiltinProps 的效果
            // 调用父类的 initBuiltinProps 方法
            originalInitProps.call(this)

            this.props.has(getConvertedExtraKey('isGroup')) || this.props.add(getConvertedExtraKey('isGroup'), false)
          },
        },
      })

      // TODO: 是否需要
      Object.defineProperties(Simulator.prototype, {
        computeDashboardRect: {
          value(this: Simulator, node: Node) {
            const instances = this.getComponentInstances(node)
            if (!instances) {
              return null
            }
            return this.computeComponentInstanceRect(instances[0])
          },
        },
        computeComponentInstanceDashboardRect: {
          value(this: Simulator, instance: ComponentInstance) {
            if (!instance || !instance.parentNode) return new DOMRect(0, 0, 0, 0)

            // const style = instance.parentNode.style
            const properties = getComputedStyle(instance.parentNode)
            return new DOMRect(
              Number.parseFloat(properties.left ?? 0),
              Number.parseFloat(properties.top ?? 0),
              Number.parseFloat(properties.width ?? 0),
              Number.parseFloat(properties.height ?? 0),
            )
          },
        },
      })
    },
  }
}

export default DashboardPlugin
