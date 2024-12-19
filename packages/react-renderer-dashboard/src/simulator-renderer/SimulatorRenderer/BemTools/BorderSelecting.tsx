import type { Node, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'

interface BorderSelectingInstanceProps {
  host: Simulator
  node: Node
}

const BorderSelectingInstance: React.FC<BorderSelectingInstanceProps> = observer(({ host, node }) => {
  const rect = node.getDashboardRect()
  const style = {
    width: rect.width,
    height: rect.height,
    transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
  }

  return (
    <div className='lc-borders lc-borders-selecting' style={style}>
      {/* <Title title={title} className='lc-borders-title' />
      {isLocked ? <Title title={intl('locked')} className='lc-borders-status' /> : null} */}
    </div>
  )
})

interface BorderSelectingProps {
  host: Simulator
}

export const BorderSelecting: React.FC<BorderSelectingProps> = observer(({ host }) => {
  const { selection } = host.designer
  const dragging = host.designer.dragon.dragging
  const selecting = dragging ? selection.getTopNodes() : selection.getNodes()

  if (!selecting || selecting.length < 1) {
    return null
  }

  return (
    <>
      {selecting.map(node => (
        <BorderSelectingInstance key={node.id} host={host} node={node} />
      ))}
    </>
  )
})
