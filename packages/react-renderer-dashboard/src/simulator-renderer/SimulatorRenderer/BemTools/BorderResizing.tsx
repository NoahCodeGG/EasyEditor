import type { Designer, Node, OffsetObserver, Rect, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'
import { Component, useMemo } from 'react'
import DragResizeEngine, { Direction } from './drag-resize-engine'
import { calculateDashboardRectBox } from './utils'

interface BorderResizingInstanceProps {
  observed: OffsetObserver
  highlight?: boolean
  dragging?: boolean
  designer: Designer
}

/** resize 的最小宽度 */
const RESIZE_MIN_WIDTH = 50
/** resize 的最小高度 */
const RESIZE_MIN_HEIGHT = 50

export const BorderResizingInstance = observer(
  class BoxResizingInstance extends Component<BorderResizingInstanceProps> {
    // private outline: any;
    private willUnbind: () => any

    // outline of eight direction
    private outlineN: any
    private outlineE: any
    private outlineS: any
    private outlineW: any
    private resizeSideN: any
    private resizeSideE: any
    private resizeSideS: any
    private resizeSideW: any
    private resizeCornerNE: any
    private resizeCornerNW: any
    private resizeCornerSE: any
    private resizeCornerSW: any

    private dragEngine: DragResizeEngine

    constructor(props: any) {
      super(props)
      this.dragEngine = new DragResizeEngine(props.designer)
    }

    /**
     * 计算 resize 后的 rect
     * @param direction 方向
     * @param delta 偏移量
     * @param startNodeRect 拖拽开始时的 rect
     */
    private calculateResizeRectByDirection(direction: Direction, delta: { x: number; y: number }, startNodeRect: Rect) {
      const newRect = {
        width: startNodeRect.width,
        height: startNodeRect.height,
        x: startNodeRect.x,
        y: startNodeRect.y,
      }

      switch (direction) {
        case Direction.N:
          if (startNodeRect.height - delta.y > RESIZE_MIN_HEIGHT) {
            newRect.height = startNodeRect.height - delta.y
            newRect.y = startNodeRect.y + delta.y
          } else {
            newRect.height = RESIZE_MIN_HEIGHT
            newRect.y = startNodeRect.y + startNodeRect.height - RESIZE_MIN_HEIGHT
          }
          break
        case Direction.S:
          newRect.height =
            startNodeRect.height + delta.y > RESIZE_MIN_HEIGHT ? startNodeRect.height + delta.y : RESIZE_MIN_HEIGHT
          break
        case Direction.W:
          if (startNodeRect.width - delta.x > RESIZE_MIN_WIDTH) {
            newRect.width = startNodeRect.width - delta.x
            newRect.x = startNodeRect.x + delta.x
          } else {
            newRect.width = RESIZE_MIN_WIDTH
            newRect.x = startNodeRect.x + startNodeRect.width - RESIZE_MIN_WIDTH
          }
          break
        case Direction.E:
          newRect.width =
            startNodeRect.width + delta.x > RESIZE_MIN_WIDTH ? startNodeRect.width + delta.x : RESIZE_MIN_WIDTH
          break
        case Direction.NW:
          if (startNodeRect.width - delta.x > RESIZE_MIN_WIDTH) {
            newRect.width = startNodeRect.width - delta.x
            newRect.x = startNodeRect.x + delta.x
          } else {
            newRect.width = RESIZE_MIN_WIDTH
            newRect.x = startNodeRect.x + startNodeRect.width - RESIZE_MIN_WIDTH
          }
          if (startNodeRect.height - delta.y > RESIZE_MIN_HEIGHT) {
            newRect.height = startNodeRect.height - delta.y
            newRect.y = startNodeRect.y + delta.y
          } else {
            newRect.height = RESIZE_MIN_HEIGHT
            newRect.y = startNodeRect.y + startNodeRect.height - RESIZE_MIN_HEIGHT
          }
          break
        case Direction.NE:
          newRect.width =
            startNodeRect.width + delta.x > RESIZE_MIN_WIDTH ? startNodeRect.width + delta.x : RESIZE_MIN_WIDTH
          if (startNodeRect.height - delta.y > RESIZE_MIN_HEIGHT) {
            newRect.height = startNodeRect.height - delta.y
            newRect.y = startNodeRect.y + delta.y
          } else {
            newRect.height = RESIZE_MIN_HEIGHT
            newRect.y = startNodeRect.y + startNodeRect.height - RESIZE_MIN_HEIGHT
          }
          break
        case Direction.SE:
          newRect.width =
            startNodeRect.width + delta.x > RESIZE_MIN_WIDTH ? startNodeRect.width + delta.x : RESIZE_MIN_WIDTH
          newRect.height =
            startNodeRect.height + delta.y > RESIZE_MIN_HEIGHT ? startNodeRect.height + delta.y : RESIZE_MIN_HEIGHT
          break
        case Direction.SW:
          newRect.width =
            startNodeRect.width - delta.x > RESIZE_MIN_WIDTH ? startNodeRect.width - delta.x : RESIZE_MIN_WIDTH
          if (startNodeRect.height + delta.y > RESIZE_MIN_HEIGHT) {
            newRect.height = startNodeRect.height + delta.y
            newRect.y = startNodeRect.y + delta.y
          } else {
            newRect.height = RESIZE_MIN_HEIGHT
            newRect.y = startNodeRect.y + startNodeRect.height - RESIZE_MIN_HEIGHT
          }
          newRect.x = startNodeRect.x + delta.x
          break
      }

      return new DOMRect(newRect.x, newRect.y, newRect.width, newRect.height)
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
      const resizeRect = this.calculateResizeRectByDirection(direction, delta, startNodeRect)

      switch (direction) {
        case Direction.N:
          node.updateDashboardRect({
            y: resizeRect.y,
            height: resizeRect.height,
          })
          break
        case Direction.S:
          node.updateDashboardRect({
            height: resizeRect.height,
          })
          break
        case Direction.W:
          node.updateDashboardRect({
            x: resizeRect.x,
            width: resizeRect.width,
          })
          break
        case Direction.E:
          node.updateDashboardRect({
            width: resizeRect.width,
          })
          break
        case Direction.NW:
          node.updateDashboardRect({
            x: resizeRect.x,
            y: resizeRect.y,
            width: resizeRect.width,
            height: resizeRect.height,
          })
          break
        case Direction.NE:
          node.updateDashboardRect({
            y: resizeRect.y,
            width: resizeRect.width,
            height: resizeRect.height,
          })
          break
        case Direction.SE:
          node.updateDashboardRect({
            width: resizeRect.width,
            height: resizeRect.height,
          })
          break
        case Direction.SW:
          node.updateDashboardRect({
            x: resizeRect.x,
            width: resizeRect.width,
            height: resizeRect.height,
          })
          break
      }

      // 如果是分组的话，还需要更新子节点的位置和大小
      if (node.isGroup) {
        // 根据分组的缩放大小计算，缩放比例
        const ratioWidth = resizeRect.width / startNodeRect.width
        const ratioHeight = resizeRect.height / startNodeRect.height

        for (const child of node.getAllNodesInGroup()) {
          // 子节点根据新的缩放比例重新计算位置
          const childRect = child.getDashboardRect()
          child.updateDashboardRect({
            x: resizeRect.x + (childRect.x - startNodeRect.x) * ratioWidth,
            y: resizeRect.y + (childRect.y - startNodeRect.y) * ratioHeight,
            width: childRect.width * ratioWidth,
            height: childRect.height * ratioHeight,
          })
        }
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
      const domNode = node.getDashboardContainer()
      if (!domNode) {
        return
      }

      const resizeRect = this.calculateResizeRectByDirection(direction, delta, startNodeRect)
      domNode.style.left = `${resizeRect.x}px`
      domNode.style.top = `${resizeRect.y}px`
      domNode.style.width = `${resizeRect.width}px`
      domNode.style.height = `${resizeRect.height}px`
      this.updateAllOutlines(resizeRect)

      // 如果是分组的话，还需要更新子节点的位置和大小
      if (node.isGroup) {
        // 根据分组的缩放大小计算，缩放比例
        const ratioWidth = resizeRect.width / startNodeRect.width
        const ratioHeight = resizeRect.height / startNodeRect.height

        for (const child of node.getAllNodesInGroup()) {
          const childDom = child.getDashboardContainer()
          if (!childDom) continue

          // 子节点根据新的缩放比例重新计算位置
          const childRect = child.getDashboardRect()
          childDom.style.left = `${startNodeRect.x + (childRect.x - startNodeRect.x) * ratioWidth}px`
          childDom.style.top = `${startNodeRect.y + (childRect.y - startNodeRect.y) * ratioHeight}px`
          childDom.style.width = `${childRect.width * ratioWidth}px`
          childDom.style.height = `${childRect.height * ratioHeight}px`
        }
      }
    }

    /**
     * 更新所有 outline 通过 DOM
     * @param rect 矩形
     */
    private updateAllOutlines(rect: { x: number; y: number; width: number; height: number }) {
      // 更新四边
      this.outlineN.style.width = `${rect.width}px`
      this.outlineN.style.transform = `translate(${rect.x}px, ${rect.y}px)`
      this.resizeSideN.style.width = `${rect.width}px`
      this.resizeSideN.style.transform = `translate(${rect.x}px, ${rect.y - 10}px)`

      this.outlineS.style.width = `${rect.width}px`
      this.outlineS.style.transform = `translate(${rect.x}px, ${rect.y + rect.height}px)`
      this.resizeSideS.style.width = `${rect.width}px`
      this.resizeSideS.style.transform = `translate(${rect.x}px, ${rect.y + rect.height - 10}px)`

      this.outlineE.style.height = `${rect.height}px`
      this.outlineE.style.transform = `translate(${rect.x + rect.width}px, ${rect.y}px)`
      this.resizeSideE.style.height = `${rect.height}px`
      this.resizeSideE.style.transform = `translate(${rect.x + rect.width - 10}px, ${rect.y}px)`

      this.outlineW.style.height = `${rect.height}px`
      this.outlineW.style.transform = `translate(${rect.x}px, ${rect.y}px)`
      this.resizeSideW.style.height = `${rect.height}px`
      this.resizeSideW.style.transform = `translate(${rect.x - 10}px, ${rect.y}px)`

      // 更新四角
      this.resizeCornerNW.style.transform = `translate(${rect.x - 3}px, ${rect.y - 3}px)`
      this.resizeCornerNE.style.transform = `translate(${rect.x + rect.width - 5}px, ${rect.y - 3}px)`
      this.resizeCornerSW.style.transform = `translate(${rect.x - 3}px, ${rect.y + rect.height - 5}px)`
      this.resizeCornerSE.style.transform = `translate(${rect.x + rect.width - 5}px, ${rect.y + rect.height - 5}px)`
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
        startNodeRect = node.getDashboardRect()
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
        !this.resizeSideN &&
        !this.resizeSideE &&
        !this.resizeSideS &&
        !this.resizeSideW &&
        !this.resizeCornerNE &&
        !this.resizeCornerNW &&
        !this.resizeCornerSE &&
        !this.resizeCornerSW
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
          this.dragEngine.from(this.resizeSideN, Direction.N, () => node),
          this.dragEngine.from(this.resizeSideE, Direction.E, () => node),
          this.dragEngine.from(this.resizeSideS, Direction.S, () => node),
          this.dragEngine.from(this.resizeSideW, Direction.W, () => node),
          this.dragEngine.from(this.resizeCornerNE, Direction.NE, () => node),
          this.dragEngine.from(this.resizeCornerNW, Direction.NW, () => node),
          this.dragEngine.from(this.resizeCornerSE, Direction.SE, () => node),
          this.dragEngine.from(this.resizeCornerSW, Direction.SW, () => node),
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

      const baseBorderClass = 'lc-borders lc-resize-border'
      const baseSideClass = 'lc-borders lc-resize-side'
      const baseCornerClass = 'lc-borders lc-resize-corner'

      return (
        <div>
          <div
            ref={ref => {
              this.outlineN = ref
            }}
            className={baseBorderClass}
            style={{
              width: offsetWidth,
              height: 1,
              transform: `translate(${offsetLeft}px, ${offsetTop}px)`,
            }}
          />
          <div
            ref={ref => {
              this.resizeSideN = ref
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
              this.resizeCornerNE = ref
            }}
            className={`${baseCornerClass} ne`}
            style={{
              transform: `translate(${offsetLeft + offsetWidth - 5}px, ${offsetTop - 3}px)`,
              cursor: 'nesw-resize',
            }}
          />

          <div
            ref={ref => {
              this.outlineE = ref
            }}
            className={baseBorderClass}
            style={{
              width: 1,
              height: offsetHeight,
              transform: `translate(${offsetLeft + offsetWidth}px, ${offsetTop}px)`,
            }}
          />
          <div
            className={`${baseSideClass} e`}
            ref={ref => {
              this.resizeSideE = ref
            }}
            style={{
              height: offsetHeight,
              transform: `translate(${offsetLeft + offsetWidth - 10}px, ${offsetTop}px)`,
              width: 20,
            }}
          />

          <div
            ref={ref => {
              this.resizeCornerSE = ref
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
            className={baseBorderClass}
            style={{
              width: offsetWidth,
              height: 1,
              transform: `translate(${offsetLeft}px, ${offsetTop + offsetHeight}px)`,
            }}
          />
          <div
            ref={ref => {
              this.resizeSideS = ref
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
              this.resizeCornerSW = ref
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
            className={baseBorderClass}
            style={{
              width: 1,
              height: offsetHeight,
              transform: `translate(${offsetLeft}px, ${offsetTop}px)`,
            }}
          />
          <div
            ref={ref => {
              this.resizeSideW = ref
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
              this.resizeCornerNW = ref
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
  dragging: boolean
}

const BorderResizingForNode: React.FC<BorderResizingForNodeProps> = observer(({ host, node, dragging }) => {
  const { designer } = host
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

interface BorderResizingForBoxProps {
  host: Simulator
  nodes: Node[]
  dragging: boolean
}

const BorderResizingForBox: React.FC<BorderResizingForBoxProps> = observer(({ nodes, dragging }) => {
  const { designer } = host
  const boxRect = useMemo(() => calculateDashboardRectBox(nodes), [nodes])

  if (dragging) {
    return null
  }

  return <BorderResizingInstance dragging={dragging} observed={boxRect} designer={designer} />
})

interface BorderResizingProps {
  host: Simulator
}

export const BorderResizing: React.FC<BorderResizingProps> = observer(({ host }) => {
  const { selection } = host.designer
  const dragging = host.designer.dragon.dragging
  const selecting = dragging ? selection.getTopNodes() : selection.getNodes()

  if (!selecting) {
    return null
  }

  if (selecting.length > 1) {
    return <BorderResizingForBox host={host} nodes={selecting} dragging={dragging} />
  }

  return (
    <>
      {selecting.map(node => (
        <BorderResizingForNode key={node.id} host={host} node={node} dragging={dragging} />
      ))}
    </>
  )
})
