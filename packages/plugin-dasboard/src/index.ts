import { DragObjectType, type Plugin } from '@easy-editor/core'

const DashboardPlugin: Plugin = ctx => {
  return {
    name: 'DashboardPlugin',
    deps: [],
    init() {
      const { designer, logger } = ctx

      designer.dragon.onDragstart(e => {
        logger.log('dragstart', e)
      })

      designer.dragon.onDrag(e => {
        if (e.dragObject && e.dragObject.type === DragObjectType.Node) {
          logger.log('drag', e)

          const nodes = e.dragObject.nodes!
          for (const node of nodes) {
            // TODO: 想一下名字，对应插件的可以放在特地的位置
            node?.setExtraProp('$.dashboard.position', { x: e.canvasX, y: e.canvasY })
          }
        }
      })

      designer.dragon.onDragend(e => {
        logger.log('dragend', e)

        // add dashboard position
        if (e.dragObject && e.dragObject.type === DragObjectType.NodeData) {
          const nodeData = Array.isArray(e.dragObject.data) ? e.dragObject.data : [e.dragObject.data]
          for (const schema of nodeData) {
            if (!schema) continue
            if (!schema.$) {
              schema.$ = {}
            }
            if (!schema.$.dashboard) {
              schema.$.dashboard = {}
            }
            if (!schema.$.dashboard.position) {
              schema.$.dashboard.position = {}
            }
            schema.$.dashboard.position = { x: e.canvasX, y: e.canvasY }
          }

          logger.log('dragend', nodeData)
        }
      })
    },
  }
}

DashboardPlugin.pluginName = 'DashboardPlugin'

export default DashboardPlugin
