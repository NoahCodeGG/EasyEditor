import type { Simulator } from '@easy-editor/core'
import { useEffect, useRef } from 'react'
import { simulatorRenderer } from '.'

interface SimulatorRendererProps {
  // editor: Editor
  host: Simulator
}

export const SimulatorRenderer = ({ host }: SimulatorRendererProps) => {
  const iframeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    simulatorRenderer.mount(host)
    host.mountContentFrame(iframeRef.current)
  }, [])

  return <div ref={iframeRef} />
}
