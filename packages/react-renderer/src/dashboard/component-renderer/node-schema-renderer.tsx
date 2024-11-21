import type { Designer, NodeSchema, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react-lite'
import { memo } from 'react'
import { useRendererContext } from './context'

export interface NodeSchemaRendererProps {
  schema: NodeSchema
  isRootNode?: boolean
}

export const NodeSchemaRenderer = memo(
  (props: NodeSchemaRendererProps) => {
    const { schema, isRootNode = false } = props
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
        if (ref) {
          ref.id = schema.id
        }
        simulator?.setInstance(docId, schema.id, ref)
      },
    }
    const compProps = {}
    Object.assign(compProps, defaultProps)
    Object.assign(compProps, schema?.props ?? {})

    return isRootNode ? (
      <Comp {...compProps}>
        {schema.children && schema.children.map(e => <NodeSchemaRenderer key={e.id} schema={e} />)}
      </Comp>
    ) : (
      <NodeMask schema={schema}>
        <Comp {...compProps}>
          {schema.children && schema.children.map(e => <NodeSchemaRenderer key={e.id} schema={e} />)}
        </Comp>
      </NodeMask>
    )
  },
  (prev, next) => {
    return JSON.stringify(prev.schema) === JSON.stringify(next.schema)
  },
)

interface NodeMaskProps {
  schema: NodeSchema
  children: React.ReactNode
}

const NodeMask = observer((props: NodeMaskProps) => {
  const { schema } = props
  const { designMode, editor } = useRendererContext()
  const designer = editor?.get<Designer>('designer')

  let isHover = false
  let isSelected = false

  if (designMode === 'design') {
    isHover = designer?.detecting.current?.id === schema.id
    isSelected = designer?.selection.has(schema.id) ?? false
  }

  return (
    <div
      id={`${schema.id}-mask`}
      style={{
        position: 'absolute',
        transform: `translate(${schema.$position.x}px, ${schema.$position.y}px)`,
        border: isSelected ? '2px solid red' : isHover ? '1px solid blue' : 'none',
      }}
    >
      {props.children}
    </div>
  )
})
