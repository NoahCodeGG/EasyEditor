import { editor } from '@/editor'
import type React from 'react'
import { useEffect, useState } from 'react'

interface CustomComponentInfo {
  id: string
  packagePath: string
  devMode: boolean
  metadata: {
    title: string
    componentName: string
    [key: string]: any
  }
  registeredAt: Date
}

export const DevComponentPanel: React.FC = () => {
  const [components, setComponents] = useState<CustomComponentInfo[]>([])

  useEffect(() => {
    const loadComponents = async () => {
      // 获取自定义组件API
      const api = editor.get('CustomComponentsPlugin')
      if (api) {
        const registeredComponents = api.getRegisteredComponents()
        setComponents(registeredComponents)

        // 监听组件变化
        editor.eventBus.on('custom-component:registered', () => {
          setComponents(api.getRegisteredComponents())
        })

        editor.eventBus.on('custom-component:refreshed', () => {
          setComponents(api.getRegisteredComponents())
        })

        editor.eventBus.on('custom-component:unregistered', () => {
          setComponents(api.getRegisteredComponents())
        })
      }
    }

    loadComponents()

    return () => {
      // 清理事件监听
      const api = editor.get('CustomComponentsPlugin')
      if (api) {
        editor.eventBus.off('custom-component:registered')
        editor.eventBus.off('custom-component:refreshed')
        editor.eventBus.off('custom-component:unregistered')
      }
    }
  }, [editor])

  const handleRefreshComponent = (id: string) => {
    const api = editor.get('CustomComponentsPlugin')
    if (api) {
      api.refreshComponent(id)
      console.log(`刷新组件: ${id}`)
    }
  }

  if (components.length === 0) {
    return (
      <div className='custom-component-panel empty'>
        <h3>自定义组件</h3>
        <p>暂无自定义组件</p>
      </div>
    )
  }

  return (
    <div className='custom-component-panel'>
      <h3>自定义组件 ({components.length})</h3>

      <div className='component-list'>
        {components.map(component => (
          <div key={component.id} className='component-item'>
            <div className='component-header'>
              <span className='component-title'>{component.metadata.title}</span>
              <span className={`component-mode ${component.devMode ? 'dev' : 'prod'}`}>
                {component.devMode ? '开发模式' : '生产模式'}
              </span>
            </div>

            <div className='component-info'>
              <div>ID: {component.id}</div>
              <div>路径: {component.packagePath}</div>
              <div>注册时间: {new Date(component.registeredAt).toLocaleString()}</div>
            </div>

            <div className='component-actions'>
              <button className='refresh-button' onClick={() => handleRefreshComponent(component.id)}>
                刷新组件
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-component-panel {
          padding: 16px;
          background-color: #f5f7fa;
          border-radius: 8px;
          margin-top: 20px;
        }

        .custom-component-panel h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #1890ff;
        }

        .custom-component-panel.empty p {
          color: #999;
          text-align: center;
          padding: 20px 0;
        }

        .component-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .component-item {
          background-color: white;
          border-radius: 6px;
          padding: 12px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .component-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .component-title {
          font-weight: 500;
          font-size: 16px;
        }

        .component-mode {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .component-mode.dev {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        .component-mode.prod {
          background-color: #f6ffed;
          color: #52c41a;
        }

        .component-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
        }

        .component-actions {
          display: flex;
          justify-content: flex-end;
        }

        .refresh-button {
          background-color: #1890ff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-button:hover {
          background-color: #40a9ff;
        }
      `}</style>
    </div>
  )
}
