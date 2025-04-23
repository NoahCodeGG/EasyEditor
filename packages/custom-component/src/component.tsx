import type React from 'react'
import { useEffect, useState } from 'react'
import './styles.css'

export interface CustomComponentProps {
  title?: string
  content?: string
  theme?: 'light' | 'dark' | 'colorful'
  fontSize?: number
  showBorder?: boolean
  borderColor?: string
  refreshInterval?: number
}

export const Component: React.FC<CustomComponentProps> = ({
  title = '自定义组件',
  content = '这是一个自定义组件示例',
  theme = 'light',
  fontSize = 16,
  showBorder = true,
  borderColor = '#1890ff',
  refreshInterval = 0,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [counter, setCounter] = useState(0)

  // 自动刷新计时器
  useEffect(() => {
    if (refreshInterval <= 0) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setCounter(prev => prev + 1)
    }, refreshInterval * 1000)

    return () => clearInterval(timer)
  }, [refreshInterval])

  // 主题样式
  const getThemeClass = () => {
    switch (theme) {
      case 'dark':
        return 'custom-component-dark'
      case 'colorful':
        return 'custom-component-colorful'
      default:
        return 'custom-component-light'
    }
  }

  // 边框样式
  const borderStyle = showBorder ? { border: `2px solid ${borderColor}` } : {}

  return (
    <div
      className={`custom-component ${getThemeClass()}`}
      style={{
        ...borderStyle,
        fontSize: `${fontSize}px`,
      }}
    >
      <div className='custom-component-header'>
        <h3>{title}</h3>
        {refreshInterval > 0 && <div className='custom-component-time'>{currentTime.toLocaleTimeString()}</div>}
      </div>

      <div className='custom-component-content'>
        <p>{content}</p>
        {refreshInterval > 0 && <div className='custom-component-counter'>自动刷新次数: {counter}</div>}
      </div>

      <div className='custom-component-footer'>
        <span>EasyEditor 自定义组件示例</span>
      </div>
    </div>
  )
}
