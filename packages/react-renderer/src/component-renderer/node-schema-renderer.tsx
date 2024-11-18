import type { NodeSchema } from '@easy-editor/core'
import { memo } from 'react'
import { useRendererContext } from './context'

export interface NodeSchemaRendererProps {
  schema: NodeSchema
}

export const NodeSchemaRenderer = memo(
  (props: NodeSchemaRendererProps) => {
    const { schema } = props
    const { components, designMode } = useRendererContext()

    if (!components[schema.componentName]) {
      throw new Error(`component ${schema.componentName} not found`)
    }
    const Comp = components[schema.componentName]

    const defaultProps = {
      key: schema.id,
      __id: schema.id,
      __designMode: designMode,
      __componentName: schema.componentName,
      __schema: schema,
      // ref: ref => {
      //   bindDomRef?.(schema.id, ref)
      // },
    }
    const compProps = {}
    Object.assign(compProps, defaultProps)
    Object.assign(compProps, schema?.props ?? {})

    return (
      <Comp {...compProps}>
        {schema.children && schema.children.map(e => <NodeSchemaRenderer key={e.id} schema={e} />)}
      </Comp>
    )
  },
  (prev, next) => {
    return JSON.stringify(prev.schema) === JSON.stringify(next.schema)
  },
)
