import type { Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'
import { memo } from 'react'
import './border.css'

interface BorderDetectingInstanceProps {
  title: string
  scale: number
  rect: DOMRect | null
  isLocked?: boolean
}

const BorderDetectingInstance: React.FC<BorderDetectingInstanceProps> = memo(({ title, scale, rect, isLocked }) => {
  if (!rect) {
    return null
  }

  const style = {
    // width: rect.width * scale,
    // height: rect.height * scale,
    // transform: `translate(${rect.left * scale}px, ${rect.top * scale}px)`,
    width: rect.width,
    height: rect.height,
    transformOrigin: '0 0',
    transform: `translate(${rect.left}px, ${rect.top}px)`,
  }

  return (
    <div className='lc-borders lc-borders-detecting' style={style}>
      {/* <Title title={title} className='lc-borders-title' />
      {isLocked ? <Title title={intl('locked')} className='lc-borders-status' /> : null} */}
    </div>
  )
})

interface BorderDetectingProps {
  host: Simulator
}

export const BorderDetecting: React.FC<BorderDetectingProps> = observer(({ host }) => {
  const curDoc = host.designer.project.currentDocument
  const { selection } = host.designer
  const { current } = host.designer.detecting
  if (!current || current.document !== curDoc || selection.has(current.id)) {
    return null
  }

  const canHoverHook = current?.componentMeta.advanced.callbacks?.onHoverHook
  const canHover = canHoverHook && typeof canHoverHook === 'function' ? canHoverHook(current) : true

  if (!canHover || !current) {
    return null
  }

  const rootNode = current.document.rootNode
  if (!rootNode!.contains(current)) {
    return null
  }

  const instances = host.getComponentInstances(current)
  if (!instances || instances.length < 1) {
    return null
  }
  console.log(
    '🚀 ~ constBorderDetecting:React.FC<BorderDetectingProps>=observer ~ instances:',
    host.computeComponentInstanceRect(instances[0]),
    document.getElementById(`${current.id}-container`)?.getBoundingClientRect(),
  )

  return (
    <>
      {instances.map((inst, i) => (
        <BorderDetectingInstance
          key={`line-h-${i}`}
          title={current.title}
          scale={host.viewport.scale}
          // scrollX={this.scrollX}
          // scrollY={this.scrollY}
          // rect={host.computeComponentInstanceRect(inst)}
          rect={getNodeRectByDOM(current.id)}
          // rect={document.querySelector(`${current.id}-container`)?.getBoundingClientRect()}
        />
      ))}
    </>
  )
})

const getNodeRectByDOM = (nodeId: string) => {
  const domNode = document.getElementById(`${nodeId}-container`)
  if (domNode) {
    const properties = getComputedStyle(domNode)
    return new DOMRect(
      Number.parseFloat(properties.left),
      Number.parseFloat(properties.top),
      Number.parseFloat(properties.width),
      Number.parseFloat(properties.height),
    )
  }
  return new DOMRect(0, 0, 0, 0)
}
