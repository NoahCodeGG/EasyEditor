import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Component, propDefinitions } from '../src'
import './dev-styles.css'

// 开发环境组件
const DevEnvironment = () => {
  // 初始化属性值
  const initialProps = propDefinitions.reduce(
    (acc, prop) => {
      acc[prop.name] = prop.defaultValue
      return acc
    },
    {} as Record<string, any>,
  )

  const [props, setProps] = useState(initialProps)

  // 处理属性变化
  const handlePropChange = (name: string, value: any) => {
    setProps(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className='dev-container'>
      <div className='props-panel'>
        <h2>组件属性</h2>

        <div className='props-list'>
          {propDefinitions.map(prop => {
            // 检查条件属性
            if (
              prop.condition &&
              !prop.condition({ getProps: () => ({ getPropValue: (name: string) => props[name] }) })
            ) {
              return null
            }

            return (
              <div key={prop.name} className='prop-item'>
                <label htmlFor={prop.name}>{prop.title}</label>
                {renderPropEditor(prop, props[prop.name], value => handlePropChange(prop.name, value))}
              </div>
            )
          })}
        </div>
      </div>

      <div className='preview-panel'>
        <h2>组件预览</h2>

        <div className='preview-container'>
          <Component {...props} />
        </div>

        <div className='json-view'>
          <h3>属性 JSON</h3>
          <pre>{JSON.stringify(props, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

// 根据属性类型渲染编辑器
const renderPropEditor = (prop: any, value: any, onChange: (value: any) => void) => {
  switch (prop.setter) {
    case 'StringSetter':
      return <input id={prop.name} type='text' value={value} onChange={e => onChange(e.target.value)} />

    case 'TextAreaSetter':
      return <textarea id={prop.name} value={value} onChange={e => onChange(e.target.value)} rows={4} />

    case 'NumberSetter':
      return (
        <input
          id={prop.name}
          type='number'
          value={value}
          min={prop.extraProps?.min}
          max={prop.extraProps?.max}
          step={prop.extraProps?.step || 1}
          onChange={e => onChange(Number(e.target.value))}
        />
      )

    case 'BoolSetter':
      return <input id={prop.name} type='checkbox' checked={value} onChange={e => onChange(e.target.checked)} />

    case 'SelectSetter':
      return (
        <select id={prop.name} value={value} onChange={e => onChange(e.target.value)}>
          {prop.extraProps?.options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'ColorSetter':
      return (
        <input
          id={prop.name}
          type='color'
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: '50px', height: '30px' }}
        />
      )

    default:
      return (
        <input
          id={prop.name}
          type='text'
          value={JSON.stringify(value)}
          onChange={e => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch (err) {
              // 解析错误，忽略
            }
          }}
        />
      )
  }
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <DevEnvironment />
  </React.StrictMode>,
)
