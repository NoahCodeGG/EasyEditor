import type { Designer, NodeSchema, Simulator } from '@easy-editor/core'
import { observer } from 'mobx-react-lite'
import { useRendererContext } from './context'

export interface NodeSchemaRendererProps {
  schema: NodeSchema
  isRootNode?: boolean
}

// TODO: 无法使用 memo 优化，因为需要根据位置信息来计算样式，group 组件需要子组件的样式信息
export const NodeSchemaRenderer = (props: NodeSchemaRendererProps) => {
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
}

interface NodeMaskProps {
  schema: NodeSchema
  children: React.ReactNode
}

const NodeMask = observer((props: NodeMaskProps) => {
  const { schema } = props
  const { designMode, editor } = useRendererContext()
  const designer = editor?.get<Designer>('designer')

  const rect = computeRect(schema)
  let isHover = false
  let isSelected = false

  if (designMode === 'design') {
    isHover = designer?.detecting.current?.id === schema.id
    isSelected = designer?.selection.has(schema.id!) ?? false
  }

  return (
    <div
      id={`${schema.id}-mask`}
      style={{
        position: 'absolute',
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        border: isSelected ? '2px solid red' : isHover ? '1px solid blue' : 'none',
        width: rect?.width ?? '100%',
        height: rect?.height ?? '100%',
      }}
    >
      {props.children}
    </div>
  )
})

/**
 * 计算节点在 dashboard 中的位置信息
 */
const computeRect = (node: NodeSchema) => {
  if (!node.isGroup || !node.children || node.children.length === 0) {
    return node.$dashboard.rect
  }

  let [minX, minY, maxX, maxY] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]

  for (const child of node.children) {
    let childRect: any
    if (child.isGroup) {
      childRect = computeRect(child)
    } else {
      childRect = child.$dashboard.rect
    }
    const x = childRect.x
    const y = childRect.y
    const width = childRect.width || 0
    const height = childRect.height || 0

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
