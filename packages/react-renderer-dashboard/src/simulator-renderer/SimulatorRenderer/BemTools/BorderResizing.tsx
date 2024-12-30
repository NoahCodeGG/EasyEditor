import type { Designer, Node, OffsetObserver, Rect, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'
import { Component } from 'react'
import DragResizeEngine from './drag-resize-engine'

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

    calculateResizeRectByDirection(
      node: Node,
      direction: string,
      delta: { x: number; y: number },
      startNodeRect: Rect,
    ) {
      if (direction === 'e') {
        node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width + delta.x)
      } else if (direction === 'w') {
        node.setExtraPropValue('$dashboard.rect.width', startNodeRect.width - delta.x)
        node.setExtraPropValue('$dashboard.rect.x', startNodeRect.x + delta.x)
      } else if (direction === 's') {
        node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height + delta.y)
      } else if (direction === 'n') {
        node.setExtraPropValue('$dashboard.rect.height', startNodeRect.height - delta.y)
        node.setExtraPropValue('$dashboard.rect.y', startNodeRect.y + delta.y)
      }
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

      let startNodeRect

      const resizeStart = ({ e, direction, node }: { e: MouseEvent; direction: string; node: Node }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResizeStart === 'function') {
          ;(e as any).trigger = direction
          advanced.callbacks.onResizeStart({ ...e, trigger: direction }, node)
        }
        startNodeRect = node.getExtraPropValue('$dashboard.rect')
      }

      const resize = ({
        e,
        direction,
        node,
        moveX,
        moveY,
      }: { e: MouseEvent; direction: string; node: Node; moveX: number; moveY: number }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResize === 'function') {
          ;(e as any).trigger = direction
          ;(e as any).deltaX = moveX
          ;(e as any).deltaY = moveY
          advanced.callbacks.onResize({ ...e, trigger: direction, deltaX: moveX, deltaY: moveY }, node)
        }
        this.calculateResizeRectByDirection(node, direction, { x: moveX, y: moveY }, startNodeRect)
        console.log('resizelog', e, direction, node, moveX, moveY)
      }

      const resizeEnd = ({ e, direction, node }: { e: MouseEvent; direction: string; node: Node }) => {
        const { advanced } = node.componentMeta
        if (advanced.callbacks && typeof advanced.callbacks.onResizeEnd === 'function') {
          ;(e as any).trigger = direction
          advanced.callbacks.onResizeEnd({ ...e, trigger: direction }, node)
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
          this.dragEngine.from(this.outlineN, 'n', () => node),
          this.dragEngine.from(this.outlineE, 'e', () => node),
          this.dragEngine.from(this.outlineS, 's', () => node),
          this.dragEngine.from(this.outlineW, 'w', () => node),
          this.dragEngine.from(this.outlineNE, 'ne', () => node),
          this.dragEngine.from(this.outlineNW, 'nw', () => node),
          this.dragEngine.from(this.outlineSE, 'se', () => node),
          this.dragEngine.from(this.outlineSW, 'sw', () => node),
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
      let triggerVisible: any = ['N', 'E', 'S', 'W', 'NE', 'NW', 'SE', 'SW']
      let offsetWidth = 0
      let offsetHeight = 0
      let offsetTop = 0
      let offsetLeft = 0
      if (observed.hasOffset) {
        offsetWidth = observed.offsetWidth
        offsetHeight = observed.offsetHeight
        offsetTop = observed.offsetTop
        offsetLeft = observed.offsetLeft
        const { node } = observed
        const metadata = node.componentMeta.getMetadata()
        // if (metadata.configure?.advanced?.getResizingHandlers) {
        //   triggerVisible = metadata.configure.advanced.getResizingHandlers(node.internalToShellNode())
        // }
      }
      // triggerVisible = normalizeTriggers(triggerVisible)
      triggerVisible = triggerVisible.map((trigger: string) => trigger?.toUpperCase())

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
              display: triggerVisible.includes('N') ? 'flex' : 'none',
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
              display: triggerVisible.includes('NE') ? 'flex' : 'none',
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
              display: triggerVisible.includes('E') ? 'flex' : 'none',
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
              display: triggerVisible.includes('SE') ? 'flex' : 'none',
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
              display: triggerVisible.includes('S') ? 'flex' : 'none',
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
              display: triggerVisible.includes('SW') ? 'flex' : 'none',
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
              display: triggerVisible.includes('W') ? 'flex' : 'none',
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
              display: triggerVisible.includes('NW') ? 'flex' : 'none',
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
