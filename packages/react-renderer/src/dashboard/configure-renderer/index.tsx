import type { Editor, FieldConfig, Node, SetterManager } from '@easy-editor/core'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { type RendererContext, RendererContextProvider, useRendererContext } from './context'

interface FieldConfigureItemProps {
  field: FieldConfig
}

const FieldConfigureItem = observer(({ field }: FieldConfigureItemProps) => {
  const { node: configNode, setterManager } = useRendererContext()
  const configProp = field.name ? configNode.getProp(field.name as string) : undefined

  let SetterComponent: any
  let setterProps = {}
  const setter = field.setter

  if (typeof setter === 'string') {
    SetterComponent = setterManager.getSetter(setter)?.component
  } else {
    SetterComponent = setterManager.getSetter(setter!.componentName)?.component
    setterProps = setter?.props || {}
  }

  // condition
  if (configProp && typeof field?.extraProps?.condition === 'function') {
    if (!field.extraProps.condition(configProp)) {
      return null
    }
  }

  const name = field?.name
  let value = configProp?.value

  if (configProp && typeof field.extraProps?.getValue === 'function') {
    value = field.extraProps?.getValue(configProp, value)
  }

  return (
    <div>
      <span>{field.title}: </span>
      <SetterComponent
        key={`${configNode.id}-${name ?? field.title}`}
        value={value}
        onChange={
          name
            ? (v: any) => {
                console.log('🚀 ~ FieldConfigureItem ~ v:', v)
                configProp?.setValue(v)
                if (configProp && typeof field.extraProps?.setValue === 'function') {
                  field.extraProps?.setValue(configProp, v)
                }
              }
            : undefined
        }
        {...setterProps}
        meta={field}
        configNode={configNode}
      >
        {field.type === 'group' && field.items?.map(item => <FieldConfigureItem key={item.name} field={item} />)}
      </SetterComponent>
    </div>
  )
})

interface ConfigureRenderProps {
  node: Node
  editor: Editor
}

export const ConfigureRender = observer<ConfigureRenderProps>(({ node, editor }) => {
  const setterManager = editor.get<SetterManager>('setterManager')!
  const configure = node.componentMeta.configure
  console.log('🚀 ~ ConfigureRender ~ configure:', configure)

  const ctx = useMemo(() => {
    const ctx = {} as RendererContext
    ctx.setterManager = setterManager
    ctx.node = node

    return ctx
  }, [setterManager, node])

  return (
    <RendererContextProvider value={ctx}>
      {configure?.map(item => (
        <FieldConfigureItem key={item.name} field={item} />
      ))}
    </RendererContextProvider>
  )
})
