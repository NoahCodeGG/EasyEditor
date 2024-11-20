import type { DocumentSchema, Simulator } from '@easy-editor/core'
import { useMemo } from 'react'
import { useForceUpdate } from '../../hooks/useForceUpdate'
import { type RendererContext, RendererContextProvider } from './context'
import { NodeSchemaRenderer } from './node-schema-renderer'

export interface DocumentSchemaRenderProps extends RendererContext {
  schema: DocumentSchema
  renderByProject?: boolean
}

export const DocumentSchemaRender = (props: DocumentSchemaRenderProps) => {
  const { schema, designMode, editor, renderByProject = false } = props
  const forceUpdate = useForceUpdate()

  const components = useMemo(() => {
    return editor?.get<Simulator>('simulator')?.components
  }, [editor])

  const ctx = useMemo(() => {
    const ctx = {} as RendererContext

    ctx.docId = schema.id
    ctx.components = components
    ctx.designMode = designMode
    ctx.forceUpdate = forceUpdate
    if (editor) {
      ctx.editor = editor
    }

    return ctx
  }, [designMode, editor, forceUpdate, components])

  return (
    <RendererContextProvider value={ctx}>
      <NodeSchemaRenderer schema={schema.rootNode} />
    </RendererContextProvider>
  )
}
