import type { Node, OffsetObserver, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'

// TODO: 相比于用 observed，我感觉这种方式更好
// interface BorderSelectingInstanceProps {
//   host: Simulator
//   node: Node
// }

// const BorderSelectingInstance: React.FC<BorderSelectingInstanceProps> = observer(({ host, node }) => {
//   const rect = node.getDashboardRect()
//   const style = {
//     width: rect.width,
//     height: rect.height,
//     transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
//   }

//   return (
//     <div className='lc-borders lc-borders-selecting' style={style}>
//       {/* <Title title={title} className='lc-borders-title' />
//       {isLocked ? <Title title={intl('locked')} className='lc-borders-status' /> : null} */}
//     </div>
//   )
// })

interface BorderSelectingInstanceProps {
  observed: OffsetObserver
  highlight?: boolean
  dragging?: boolean
}

const BorderSelectingInstance: React.FC<BorderSelectingInstanceProps> = observer(
  ({ observed, highlight, dragging }) => {
    if (!observed.hasOffset) {
      return null
    }

    const { offsetWidth, offsetHeight, offsetTop, offsetLeft } = observed
    const style = {
      width: offsetWidth,
      height: offsetHeight,
      transform: `translate3d(${offsetLeft}px, ${offsetTop}px, 0)`,
    }
    let classname = 'lc-borders lc-borders-selecting'
    if (dragging) {
      classname += ' dragging'
    }

    return (
      <div className={classname} style={style}>
        {/* <Title title={title} className='lc-borders-title' />
      {isLocked ? <Title title={intl('locked')} className='lc-borders-status' /> : null} */}
      </div>
    )
  },
)

interface BorderSelectingForNodeProps {
  host: Simulator
  node: Node
}

const BorderSelectingForNode: React.FC<BorderSelectingForNodeProps> = observer(({ host, node }) => {
  const { designer } = host
  const dragging = designer.dragon.dragging
  const instances = host.getComponentInstances(node)

  if (!instances || instances.length < 1) {
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

        return <BorderSelectingInstance key={observed.id} dragging={dragging} observed={observed} />
      })}
    </>
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
        <BorderSelectingForNode key={node.id} host={host} node={node} />
      ))}
    </>
  )
})
