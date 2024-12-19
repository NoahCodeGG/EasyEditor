import type { Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react'
import { BorderDetecting } from './BorderDetecting'

interface BemToolsProps {
  host: Simulator
}

export const BemTools: React.FC<BemToolsProps> = observer(({ host }) => {
  const { designMode } = host

  if (designMode === 'live') {
    return null
  }

  return (
    <div
      id='bem-tools'
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        overflow: 'visible',
        zIndex: 1,
      }}
    >
      <BorderDetecting host={host} />
    </div>
  )
})
