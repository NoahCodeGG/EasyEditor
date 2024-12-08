import {
  type Designer,
  type DynamicSetterProps,
  type SetterManager,
  type SettingField,
  isSetterConfig,
} from '@easy-editor/core'
import { observer } from 'mobx-react-lite'
import { type PropsWithChildren, type ReactNode, useMemo } from 'react'
import { SettingRendererContext, useSettingRendererContext } from './context'

const getSetterInfo = (field: SettingField) => {
  const { extraProps, setter } = field
  const { defaultValue } = extraProps

  let setterProps:
    | ({
        setters?: (ReactNode | string)[]
      } & Record<string, unknown>)
    | DynamicSetterProps = {}
  let setterType: any
  let initialValue: any = null

  if (isSetterConfig(setter)) {
    setterType = setter.componentName
    if (setter.props) {
      setterProps = setter.props
      if (typeof setterProps === 'function') {
        setterProps = setterProps(field)
      }
    }
    if (setter.defaultValue != null) {
      initialValue = setter.defaultValue
    }
  } else if (setter) {
    setterType = setter
  }

  if (defaultValue != null && !('defaultValue' in setterProps)) {
    setterProps.defaultValue = defaultValue
    if (initialValue == null) {
      initialValue = defaultValue
    }
  }

  if (field.valueState === -1) {
    setterProps.multiValue = true
  }

  return {
    setterProps,
    setterType,
    defaultValue: initialValue,
  }
}

interface SettingSetterProps extends PropsWithChildren {
  field: SettingField
}

const SettingSetter = observer(({ field, children }: SettingSetterProps) => {
  const { setterManager } = useSettingRendererContext()
  const { extraProps } = field
  const visible =
    extraProps?.condition && typeof extraProps.condition === 'function' ? extraProps.condition(field) !== false : true

  if (!visible) {
    return null
  }

  const { setterProps = {}, setterType, defaultValue = null } = getSetterInfo(field)
  const onChange = extraProps?.onChange
  const value = field.valueState === -1 ? null : field.getValue()
  const { component: SetterComponent, props: mixedSetterProps } = setterManager.createSetterContent(
    setterType,
    setterProps,
  )

  return (
    <SetterComponent
      key={field.id}
      field={field}
      selected={field.top?.getNode()}
      defaultValue={defaultValue}
      value={extraProps?.getValue ? extraProps.getValue(field, value) : value}
      onChange={(newVal: any) => {
        field.setValue(newVal)
        extraProps?.setValue && extraProps.setValue(field, newVal)
        onChange?.(field, newVal)
      }}
      {...mixedSetterProps}
    >
      {children}
    </SetterComponent>
  )
})

interface SettingFieldItemProps {
  field: SettingField
}

const SettingFieldItem = observer(({ field }: SettingFieldItemProps) => {
  return (
    <div className='space-y-2'>
      <label htmlFor={field.id} className='block text-sm font-medium text-gray-700'>
        {field.title}
      </label>
      <SettingSetter field={field} />
    </div>
  )
})

interface SettingFieldGroupProps {
  field: SettingField
}

const SettingFieldGroup = ({ field }: SettingFieldGroupProps) => {
  return (
    <SettingSetter field={field}>
      {field.items?.map(item => (
        <SettingFieldView key={item.id} field={item} />
      ))}
    </SettingSetter>
  )
}

interface SettingFieldViewProps {
  field: SettingField
}

export const SettingFieldView = ({ field }: SettingFieldViewProps) => {
  if (field.isGroup) {
    return <SettingFieldGroup field={field} key={field.id} />
  } else {
    return <SettingFieldItem field={field} key={field.id} />
  }
}

interface SettingRenderProps extends SettingRendererContext {}

export const SettingRender = observer<SettingRenderProps>(({ editor }) => {
  const designer = editor.get<Designer>('designer')!
  const setterManager = editor.get<SetterManager>('setterManager')!
  const { settingsManager } = designer
  const { settings } = settingsManager
  const items = settings?.items

  const ctx = useMemo(() => {
    const ctx = {} as SettingRendererContext
    ctx.setterManager = setterManager
    ctx.settingsManager = settingsManager

    return ctx
  }, [setterManager, settingsManager])

  if (!settings) {
    // 未选中节点，提示选中 或者 显示根节点设置
    return (
      <div className='lc-settings-main'>
        <div className='lc-settings-notice'>
          <p>Please select a node in canvas</p>
        </div>
      </div>
    )
  }

  // 当节点被锁定，且未开启锁定后容器可设置属性
  if (settings.isLocked) {
    return (
      <div className='lc-settings-main'>
        <div className='lc-settings-notice'>
          <p>Current node is locked</p>
        </div>
      </div>
    )
  }
  if (Array.isArray(settings.items) && settings.items.length === 0) {
    return (
      <div className='lc-settings-main'>
        <div className='lc-settings-notice'>
          <p>No config found for this type of component</p>
        </div>
      </div>
    )
  }

  if (!settings.isSameComponent) {
    // TODO: future support 获取设置项交集编辑
    return (
      <div className='lc-settings-main'>
        <div className='lc-settings-notice'>
          <p>Please select same kind of components</p>
        </div>
      </div>
    )
  }

  return (
    <SettingRendererContext value={ctx}>
      {items?.map(item => (
        <SettingFieldView key={item.id} field={item} />
      ))}
    </SettingRendererContext>
  )
})
