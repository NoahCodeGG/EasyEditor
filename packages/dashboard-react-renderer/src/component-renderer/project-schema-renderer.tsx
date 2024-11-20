import type { ProjectSchema } from '@easy-editor/core'
import { useEffect, useMemo, useState } from 'react'
import type { RendererContext } from './context'
import { DocumentSchemaRender } from './document-schema-renderer'

export interface ProjectSchemaRenderProps extends RendererContext {
  schema: ProjectSchema
  currentDocumentId?: string
}

// TODO: 思考 ProjectSchemaRender 和 DocumentSchemaRender 的 Context 设计
export const ProjectSchemaRender = (props: ProjectSchemaRenderProps) => {
  const { schema, currentDocumentId } = props
  const [curDocId, setCurDocId] = useState(currentDocumentId ?? schema!.documents?.[0]?.id)
  const currentDocumentSchema = useMemo(() => {
    const doc = schema.documents.find(doc => doc?.id === curDocId)
    if (!doc) {
      throw new Error(`document ${curDocId} not found`)
    }
    return doc
  }, [schema, curDocId])

  useEffect(() => {
    if (props.curDocId) {
      setCurDocId(props.curDocId)
    }
  }, [props.curDocId])

  return <DocumentSchemaRender {...props} schema={currentDocumentSchema} renderByProject />
}

export const ComponentRenderer = ProjectSchemaRender
