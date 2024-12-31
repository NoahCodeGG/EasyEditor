import type { Designer, Node, OffsetObserver, Rect, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'
import { Component } from 'react'
import DragResizeEngine, { Direction } from './drag-resize-engine'

interface BorderResizingInstanceProps {
  observed: OffsetObserver
  highlight?: boolean
  dragging?: boolean
  designer: Designer
}

export const BorderResizingInstance = observer(
  class BoxResizingInstance extends Component<BorderResizingInstanceProps> {
    // private outline: any;
    private willUnbind: () => any

    // outline of eight direction
    private outlineN: any
    private outlineE: any
    private outlineS: any
    private outlineW: any
    private outlineNE: any
    private outlineNW: any
    private outlineSE: any
    private outlineSW: any

    private dragEngine: DragResizeEngine

    constructor(props: any) {
      super(props)
      this.dragEngine = new DragResizeEngine(props.designer)
    }

    /**
     * 计算 resize 后的 rect
     * @param node 节点
     * @param direction 方向
     * @param delta 偏移量
     * @param startNodeRect 拖拽开始时的 rect
     */
    private updateResizeRectByDirection(
      node: Node,
      direction: Direction,
      delta: { x: number; y: number },
      startNodeRect: Rect,
    ) {
      switch (direction) {
        case Direction.N:
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height - delta.y)
          node.setExtraPropValue('$dashboard.rect.y', startNodeRect.y + delta.y)
          break
        case Direction.S:
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height + delta.y)
          break
        case Direction.W:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width - delta.x)
          node.setExtraPropValue('$dashboard.rect.x', startNodeRect.x + delta.x)
          break
        case Direction.E:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width + delta.x)
          break
        case Direction.NW:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width - delta.x)
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height - delta.y)
          node.setExtraPropValue('$dashboard.rect.x', startNodeRect.x + delta.x)
          node.setExtraPropValue('$dashboard.rect.y', startNodeRect.y + delta.y)
          break
        case Direction.NE:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width + delta.x)
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height - delta.y)
          node.setExtraPropValue('$dashboard.rect.y', startNodeRect.y + delta.y)
          break
        case Direction.SE:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width + delta.x)
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height + delta.y)
          break
        case Direction.SW:
          node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width - delta.x)
          node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height + delta.y)
          node.setExtraPropValue('$dashboard.rect.x', startNodeRect.x + delta.x)
          break
      }
    }

    /**
     * 计算 resize 后的 rect 通过 DOM 计算
     * @param node 节点
     * @param direction 方向
     * @param delta 偏移量
     * @param startNodeRect 拖拽开始时的 rect
     */
    private updateResizeRectByDirectionByDOM(
      node: Node,
      direction: Direction,
      delta: { x: number; y: number },
      startNodeRect: Rect,
    ) {
      const domNode = document.getElementById(`${node.id}-mask`)
      if (!domNode) {
        return
      }

      const newRect = {
        width: startNodeRect.width,
        height: startNodeRect.height,
        x: startNodeRect.x,
        y: startNodeRect.y,
      }

      switch (direction) {
        case Direction.N:
          newRect.height = startNodeRect.height - delta.y
          newRect.y = startNodeRect.y + delta.y
          break
        case Direction.S:
          newRect.height = startNodeRect.height + delta.y
          break
        case Direction.W:
          newRect.width = startNodeRect.width - delta.x
          newRect.x = startNodeRect.x + delta.x
          break
        case Direction.E:
          newRect.width = startNodeRect.width + delta.x
          break
        case Direction.NW:
          newRect.width = startNodeRect.width - delta.x
          newRect.height = startNodeRect.height - delta.y
          newRect.x = startNodeRect.x + delta.x
          newRect.y = startNodeRect.y + delta.y
          break
        case Direction.NE:
          newRect.width = startNodeRect.width + delta.x
          newRect.height = startNodeRect.height - delta.y
          newRect.y = startNodeRect.y + delta.y
          break
        case Direction.SE:
          newRect.width = startNodeRect.width + delta.x
          newRect.height = startNodeRect.height + delta.y
          break
        case Direction.SW:
          newRect.width = startNodeRect.width - delta.x
          newRect.height = startNodeRect.height + delta.y
          newRect.x = startNodeRect.x + delta.x
          break
      }

      domNode.style.left = `${newRect.x}px`
      domNode.style.top = `${newRect.y}px`
      domNode.style.width = `${newRect.width}px`
      domNode.style.height = `${newRect.height}px`
      this.updateAllOutlines(newRect)
    }

    /**
     * 更新所有 outline 通过 DOM
     * @param rect 矩形
     */
    private updateAllOutlines(rect: { x: number; y: number; width: number; height: number }) {
      // 更新四边
      this.outlineN.style.width = `${rect.width}px`
      this.outlineN.style.transform = `translate(${rect.x}px, ${rect.y - 10}px)`

      this.outlineS.style.width = `${rect.width}px`
      this.outlineS.style.transform = `translate(${rect.x}px, ${rect.y + rect.height - 10}px)`

      this.outlineE.style.height = `${rect.height}px`
      this.outlineE.style.transform = `translate(${rect.x + rect.width - 10}px, ${rect.y}px)`

      this.outlineW.style.height = `${rect.height}px`
      this.outlineW.style.transform = `translate(${rect.x - 10}px, ${rect.y}px)`

      // 更新四角
      this.outlineNW.style.transform = `translate(${rect.x - 3}px, ${rect.y - 3}px)`
      this.outlineNE.style.transform = `translate(${rect.x + rect.width - 5}px, ${rect.y - 3}px)`
      this.outlineSW.style.transform = `translate(${rect.x - 3}px, ${rect.y + rect.height - 5}px)`
      this.outlineSE.style.transform = `translate(${rect.x + rect.width - 5}px, ${rect.y + rect.height - 5}px)`
    }

    componentWillUnmount() {
      if (this.willUnbind) {
        this.willUnbind()
      }
      this.props.observed.purge()
    }

    componentDidMount() {
      // this.hoveringCapture.setBoundary(this.outline);
      this.willBind()

      let startNodeRect: Rect
      let lastNodeInfo: any

      const resizeStart = ({ e, direction, node }: { e: MouseEvent; direction: Direction; node: Node }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResizeStart === 'function') {
          ;(e as any).trigger = direction
          advanced.callbacks.onResizeStart({ ...e, trigger: direction }, node)
        }
        startNodeRect = node.getExtraPropValue('$dashboard.rect') as Rect
      }

      const resize = ({
        e,
        direction,
        node,
        moveX,
        moveY,
      }: { e: MouseEvent; direction: Direction; node: Node; moveX: number; moveY: number }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResize === 'function') {
          ;(e as any).trigger = direction
          ;(e as any).deltaX = moveX
          ;(e as any).deltaY = moveY
          advanced.callbacks.onResize({ ...e, trigger: direction, deltaX: moveX, deltaY: moveY }, node)
        }
        // this.calculateResizeRectByDirection(node, direction, { x: moveX, y: moveY }, startNodeRect)
        this.updateResizeRectByDirectionByDOM(node, direction, { x: moveX, y: moveY }, startNodeRect)
        lastNodeInfo = {
          node,
          direction,
          moveX,
          moveY,
        }
        console.log('resizelog', e, direction, node, moveX, moveY)
      }

      const resizeEnd = ({ e, direction, node }: { e: MouseEvent; direction: Direction; node: Node }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResizeEnd === 'function') {
          ;(e as any).trigger = direction
          advanced.callbacks.onResizeEnd({ ...e, trigger: direction }, node)
        }

        if (lastNodeInfo) {
          this.updateResizeRectByDirection(
            lastNodeInfo.node,
            lastNodeInfo.direction,
            {
              x: lastNodeInfo.moveX,
              y: lastNodeInfo.moveY,
            },
            startNodeRect,
          )
        }

        const editor = node.document?.designer.editor
        const selected = node?.componentMeta?.componentName || ''
        editor?.eventBus.emit('designer.border.resize', {
          selected,
          layout: node?.parent?.getPropValue('layout') || '',
        })
      }

      this.dragEngine.onResize(resize)
      this.dragEngine.onResizeStart(resizeStart)
      this.dragEngine.onResizeEnd(resizeEnd)
    }

    willBind() {
      if (this.willUnbind) {
        this.willUnbind()
      }

      if (
        !this.outlineN &&
        !this.outlineE &&
        !this.outlineS &&
        !this.outlineW &&
        !this.outlineNE &&
        !this.outlineNW &&
        !this.outlineSE &&
        !this.outlineSW
      ) {
        return
      }

      const unBind: any[] = []
      const { node } = this.props.observed

      unBind.push(
        ...[
          this.dragEngine.from(this.outlineN, Direction.N, () => node),
          this.dragEngine.from(this.outlineE, Direction.E, () => node),
          this.dragEngine.from(this.outlineS, Direction.S, () => node),
          this.dragEngine.from(this.outlineW, Direction.W, () => node),
          this.dragEngine.from(this.outlineNE, Direction.NE, () => node),
          this.dragEngine.from(this.outlineNW, Direction.NW, () => node),
          this.dragEngine.from(this.outlineSE, Direction.SE, () => node),
          this.dragEngine.from(this.outlineSW, Direction.SW, () => node),
        ],
      )

      this.willUnbind = () => {
        if (unBind && unBind.length > 0) {
          unBind.forEach(item => {
            item()
          })
        }
        this.willUnbind = () => {}
      }
    }

    render() {
      const { observed } = this.props
      let offsetWidth = 0
      let offsetHeight = 0
      let offsetTop = 0
      let offsetLeft = 0
      if (observed.hasOffset) {
        offsetWidth = observed.offsetWidth
        offsetHeight = observed.offsetHeight
        offsetTop = observed.offsetTop
        offsetLeft = observed.offsetLeft
      }

      const baseSideClass = 'lc-borders lc-resize-side'
      const baseCornerClass = 'lc-borders lc-resize-corner'

      return (
        <div>
          <div
            ref={ref => {
              this.outlineN = ref
            }}
            className={`${baseSideClass} n`}
            style={{
              height: 20,
              transform: `translate(${offsetLeft}px, ${offsetTop - 10}px)`,
              width: offsetWidth,
            }}
          />
          <div
            ref={ref => {
              this.outlineNE = ref
            }}
            className={`${baseCornerClass} ne`}
            style={{
              transform: `translate(${offsetLeft + offsetWidth - 5}px, ${offsetTop - 3}px)`,
              cursor: 'nesw-resize',
            }}
          />
          <div
            className={`${baseSideClass} e`}
            ref={ref => {
              this.outlineE = ref
            }}
            style={{
              height: offsetHeight,
              transform: `translate(${offsetLeft + offsetWidth - 10}px, ${offsetTop}px)`,
              width: 20,
            }}
          />
          <div
            ref={ref => {
              this.outlineSE = ref
            }}
            className={`${baseCornerClass} se`}
            style={{
              transform: `translate(${offsetLeft + offsetWidth - 5}px, ${offsetTop + offsetHeight - 5}px)`,
              cursor: 'nwse-resize',
            }}
          />
          <div
            ref={ref => {
              this.outlineS = ref
            }}
            className={`${baseSideClass} s`}
            style={{
              height: 20,
              transform: `translate(${offsetLeft}px, ${offsetTop + offsetHeight - 10}px)`,
              width: offsetWidth,
            }}
          />
          <div
            ref={ref => {
              this.outlineSW = ref
            }}
            className={`${baseCornerClass} sw`}
            style={{
              transform: `translate(${offsetLeft - 3}px, ${offsetTop + offsetHeight - 5}px)`,
              cursor: 'nesw-resize',
            }}
          />
          <div
            ref={ref => {
              this.outlineW = ref
            }}
            className={`${baseSideClass} w`}
            style={{
              height: offsetHeight,
              transform: `translate(${offsetLeft - 10}px, ${offsetTop}px)`,
              width: 20,
            }}
          />
          <div
            ref={ref => {
              this.outlineNW = ref
            }}
            className={`${baseCornerClass} nw`}
            style={{
              transform: `translate(${offsetLeft - 3}px, ${offsetTop - 3}px)`,
              cursor: 'nwse-resize',
            }}
          />
        </div>
      )
    }
  },
)

interface BorderResizingForNodeProps {
  host: Simulator
  node: Node
}

const BorderResizingForNode: React.FC<BorderResizingForNodeProps> = observer(({ host, node }) => {
  const { designer } = host
  const dragging = designer.dragon.dragging
  const instances = host.getComponentInstances(node)

  if (!instances || instances.length < 1 || dragging) {
    return null
  }

  return (
    <>
      {instances.map(instance => {
        const observed = designer.createOffsetObserver({
          node,
          instance,
        })
        if (!observed) {
          return null
        }

        return <BorderResizingInstance key={observed.id} dragging={dragging} observed={observed} designer={designer} />
      })}
    </>
  )
})

interface BorderResizingProps {
  host: Simulator
}

export const BorderResizing: React.FC<BorderResizingProps> = observer(({ host }) => {
  const { selection } = host.designer
  const dragging = host.designer.dragon.dragging
  const selecting = dragging ? selection.getTopNodes() : selection.getNodes()
  console.log('🚀 ~ constBorderResizing:React.FC<BorderResizingProps>=observer ~ selecting:', selecting)

  if (!selecting || selecting.length < 1) {
    return null
  }

  return (
    <>
      {selecting.map(node => (
        <BorderResizingForNode key={node.id} host={host} node={node} />
      ))}
    </>
  )
})
