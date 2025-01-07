import type { Designer } from '@easy-editor/core'
import { action, computed, observable } from 'mobx'

type GuideLineType = 'horizontal' | 'vertical'

interface GuideLineItem {
  id: string
  type: GuideLineType
  position: number
}

interface AlignmentLine {
  type: GuideLineType
  position: number
}

export class GuideLine {
  /**
   * 是否启用辅助线
   */
  @observable accessor enabled = true

  /**
   * 自定义辅助线数组
   */
  @observable.shallow accessor guideLines: GuideLineItem[] = []

  @computed
  get guideLinesMap() {
    const result = Object.groupBy(this.guideLines, item => item.type)
    return {
      verticalLinesMap: new Map(result.vertical?.map(item => [item.position, item])),
      horizontalLinesMap: new Map(result.horizontal?.map(item => [item.position, item])),
    }
  }

  /**
   * Document Node 的辅助线信息
   */
  @observable.shallow accessor nodeLineMap = {
    verticalLinesMap: new Map<number, AlignmentLine>(),
    horizontalLinesMap: new Map<number, AlignmentLine>(),
  }

  get currentDocument() {
    return this.designer.currentDocument
  }

  constructor(readonly designer: Designer) {}

  /**
   * 添加额外的辅助线，用于尺寸调整
   */
  addGuideLine(guideLine: GuideLineItem) {
    this.guideLines.push(guideLine)
  }

  /**
   * 删除辅助线
   */
  removeGuideLine(id: string) {
    const index = this.guideLines.findIndex(item => item.id === id)
    if (index !== -1) {
      this.guideLines.splice(index, 1)
    }
  }

  /**
   * 修改辅助线
   */
  updateGuideLine(id: string, guideLine: GuideLineItem) {
    const index = this.guideLines.findIndex(item => item.id === id)
    if (index !== -1) {
      this.guideLines[index] = guideLine
    }
  }

  /**
   * 计算页面组件的辅助线信息
   */
  @action
  calculateGuideLineInfo() {
    if (!this.enabled) return

    const verticalLinesMap = new Map<number, AlignmentLine>()
    const horizontalLinesMap = new Map<number, AlignmentLine>()

    // 获取画布上所有的组件，得到每个可以被参照对齐的组件的位置信息
    const nodes = [...this.currentDocument!.nodesMap.values()]

    // 将选中的组合和组件抛开计算之外
    const selected: string[] = []
    for (const node of this.designer.selection.getNodes()) {
      if (node.isGroup) {
        selected.push(...node.getAllNodesInGroup().map(node => node.id))
      } else {
        selected.push(node.id)
      }
    }

    nodes
      .filter(node => !node.isHidden)
      .forEach(node => {
        if (selected.includes(node.id) || node.isRootNode || node.isGroup) return

        const nodeRect = node.getDashboardRect()
        const verticalNodeLines = [nodeRect.left, nodeRect.left + nodeRect.width / 2, nodeRect.right]
        const horizontalNodeLines = [nodeRect.top, nodeRect.top + nodeRect.height / 2, nodeRect.bottom]

        for (const line of verticalNodeLines) {
          const position = Math.round(line)
          verticalLinesMap.set(position, {
            type: 'vertical',
            position,
          })
        }
        for (const line of horizontalNodeLines) {
          const position = Math.round(line)
          horizontalLinesMap.set(position, {
            type: 'horizontal',
            position,
          })
        }
      })

    this.nodeLineMap.verticalLinesMap = verticalLinesMap
    this.nodeLineMap.horizontalLinesMap = horizontalLinesMap
  }

  /**
   * 组件的吸附距离
   */
  private adsorptionSize = 10

  /**
   * 设置画布上要实时展示的对齐辅助线，返回要吸附的距离
   * @param rect 为拖动过程中组件的位置信息
   */
  @action
  getAdsorptionPosition(rect: DOMRect): {
    isAdsorption: boolean
    fillX: number | undefined
    fillY: number | undefined
  } {
    const adsorptionVerticalLine = new Set<number>()
    const adsorptionHorizontalLine = new Set<number>()
    const currentVerticalLine = [rect.left, rect.left + rect.width / 2, rect.right]
    const currentHorizontalLine = [rect.top, rect.top + rect.height / 2, rect.bottom]

    // 接下来为计算,需要知道上中下三条线中，符合条件的辅助线中的最近的一条线，再做吸附
    currentVerticalLine.forEach(item => {
      let minDistance = -1

      this.nodeLineMap.verticalLinesMap.forEach((_, pos) => {
        if (Math.abs(item - pos) < this.adsorptionSize) {
          minDistance = pos
        }
      })
      this.guideLinesMap.verticalLinesMap.forEach((_, pos) => {
        if (Math.abs(item - pos) < this.adsorptionSize) {
          minDistance = pos
        }
      })

      if (minDistance !== -1) {
        adsorptionVerticalLine.add(minDistance)
      }
    })
    currentHorizontalLine.forEach(item => {
      let minDistance = -1

      this.nodeLineMap.horizontalLinesMap.forEach((_, pos) => {
        if (Math.abs(item - pos) < this.adsorptionSize) {
          minDistance = pos
        }
      })
      this.guideLinesMap.horizontalLinesMap.forEach((_, pos) => {
        if (Math.abs(item - pos) < this.adsorptionSize) {
          minDistance = pos
        }
      })

      if (minDistance !== -1) {
        adsorptionHorizontalLine.add(minDistance)
      }
    })

    const isAdsorption = adsorptionVerticalLine.size > 0 || adsorptionHorizontalLine.size > 0
    let fillX: number | undefined = undefined
    let fillY: number | undefined = undefined
    if (isAdsorption) {
      // 如果吸附，则计算吸附的距离
      fillX = Math.min(...adsorptionVerticalLine.values())
      fillY = Math.min(...adsorptionHorizontalLine.values())
    }
    return {
      isAdsorption,
      fillX,
      fillY,
    }

    // let fillX: number | undefined
    // let fillY: number | undefined

    // adsorptionVerticalLine.forEach(item => {
    //   if (Math.abs(item - rect.left) < this.adsorptionSize) {
    //     fillX = item
    //   }

    //   if (Math.abs(item - rect.right) < this.adsorptionSize) {
    //     fillX = item - rect.width
    //   }

    //   const center = rect.left + rect.width / 2

    //   if (Math.abs(item - center) < this.adsorptionSize) {
    //     fillX = item - rect.width / 2
    //   }
    // })

    // adsorptionHorizontalLine.forEach(item => {
    //   if (Math.abs(item - rect.top) < this.adsorptionSize) {
    //     fillY = item
    //   }

    //   if (Math.abs(item - rect.bottom) < this.adsorptionSize) {
    //     fillY = item - rect.height
    //   }

    //   const center = rect.top + rect.height / 2

    //   if (Math.abs(item - center) < this.adsorptionSize) {
    //     fillY = item - rect.height / 2
    //   }
    // })
  }
}
