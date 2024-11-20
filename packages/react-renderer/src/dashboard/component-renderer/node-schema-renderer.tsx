import type { NodeSchema, Simulator } from '@easy-editor/core'
import { memo } from 'react'
import { useRendererContext } from './context'

export interface NodeSchemaRendererProps {
  schema: NodeSchema
}

export const NodeSchemaRenderer = memo(
  (props: NodeSchemaRendererProps) => {
    const { schema } = props
    const { components, designMode, editor, docId } = useRendererContext()
    const simulator = editor?.get<Simulator>('simulator')

    if (!components[schema.componentName]) {
      throw new Error(`component ${schema.componentName} not found`)
    }
    const Comp = components[schema.componentName]

    const defaultProps = {
      __id: schema.id,
      __designMode: designMode,
      __componentName: schema.componentName,
      __schema: schema,
      ref: (ref: HTMLElement) => {
        simulator?.setInstance(docId, schema.id, ref)
      },
    }
    const compProps = {}
    Object.assign(compProps, defaultProps)
    Object.assign(compProps, schema?.props ?? {})

    return (
      <div id={`${schema.id}-mask`} style={{ position: 'absolute', left: schema.$position.x, top: schema.$position.y }}>
        <Comp id={schema.id} {...compProps}>
          {schema.children && schema.children.map(e => <NodeSchemaRenderer key={e.id} schema={e} />)}
        </Comp>
      </div>
    )
  },
  (prev, next) => {
    return JSON.stringify(prev.schema) === JSON.stringify(next.schema)
  },
)
