import type { Rect } from '@easy-editor/core'

declare module '@easy-editor/core' {
  interface Document {
    /**
     * 将一批 Node 组合成 Group
     * TODO: Group 插入到哪里
     */
    group(nodeIdList: Node[] | string[]): Node | null

    /**
     * 取消组合
     * TODO: 取消组合后，Node 插入到哪里
     */
    ungroup(group: Node | string): void
  }

  interface Node {
    /**
     * 获取 dashboard 位置信息
     */
    getDashboardRect(): Rect

    /**
     * 是否是 Group
     */
    isGroup: boolean

    /**
     * 获取当前处于的 Group
     */
    getCurrentGroup(): Node | null

    /**
     * 获取最顶层的 Group
     */
    getTopGroup(): Node | null

    /**
     * 获取当前 Node 的所有 Group
     */
    getAllGroups(): Node[]

    /**
     * 获取当前 Group 下的所有 Node
     */
    getAllNodesInGroup(): Node[]
  }

  interface NodeSchema {
    /**
     * 是否是分组
     */
    isGroup: boolean

    /**
     * dashboard 额外信息
     */
    $dashboard?: {
      /**
       * 位置信息
       */
      rect?: DashboardRect
    }
  }
}

export interface DashboardRect {
  x?: number
  y?: number
  width?: number
  height?: number
}
