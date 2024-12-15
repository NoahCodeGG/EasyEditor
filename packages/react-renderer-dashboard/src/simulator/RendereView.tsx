import { DESIGNER_EVENT, type Simulator } from '@easy-editor/core'
import { Component, type ReactInstance } from 'react'
import type { DocumentInstance, SimulatorRendererContainer } from '.'
import { LowCodeRenderer } from '..'

/**
 * judges if current simulator renderer detached or not
 * @returns detached or not
 */
export function isRendererDetached() {
  // if current iframe detached from host document, the `window.parent` will be undefined.
  return !window.parent
}

export class RendererView extends Component<{
  rendererContainer: SimulatorRendererContainer
  documentInstance: DocumentInstance
  host: Simulator
}> {
  startTime: number | null = null
  schemaChangedSymbol = false

  componentDidUpdate() {
    this.recordTime()
  }

  recordTime() {
    if (this.startTime) {
      const time = Date.now() - this.startTime
      const nodeCount = this.props.host.designer.currentDocument?.getNodeCount?.()
      this.props.host.designer.postEvent(DESIGNER_EVENT.NODE_RENDER, {
        componentName: 'Renderer',
        type: 'All',
        time,
        nodeCount,
      })
    }
  }

  componentDidMount() {
    this.recordTime()
  }

  getSchemaChangedSymbol = () => {
    return this.schemaChangedSymbol
  }

  setSchemaChangedSymbol = (symbol: boolean) => {
    this.schemaChangedSymbol = symbol
  }

  render() {
    const { documentInstance, rendererContainer: renderer, host } = this.props
    const { container, document } = documentInstance
    const { designMode, device } = container
    this.startTime = Date.now()
    this.schemaChangedSymbol = false

    if (!container.autoRender || isRendererDetached()) {
      return null
    }

    return (
      <LowCodeRenderer
        schema={documentInstance.schema}
        components={container.components}
        appHelper={container.context}
        designMode={designMode}
        device={device}
        documentId={document.id}
        suspended={documentInstance.suspended}
        getSchemaChangedSymbol={this.getSchemaChangedSymbol}
        setSchemaChangedSymbol={this.setSchemaChangedSymbol}
        getNode={(id: string) => documentInstance.getNode(id)!}
        rendererName='PageRenderer'
        thisRequiredInJSE={host.thisRequiredInJSE}
        notFoundComponent={host.notFoundComponent}
        faultComponent={host.faultComponent}
        __host={host}
        __container={container}
        onCompGetRef={(schema: any, ref: ReactInstance | null) => {
          documentInstance.mountInstance(schema.id, ref)
        }}
        enableStrictNotFoundMode={host.enableStrictNotFoundMode}
      />
    )
  }
}
