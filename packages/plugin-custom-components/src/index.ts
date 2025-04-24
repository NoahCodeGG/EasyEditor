import type { PluginCreator } from '@easy-editor/core'
import { ComponentLoader } from './component-loader'
import { type ComponentConfig, ComponentRegistry } from './component-registry'

export interface CustomComponentsPluginOptions {
  /** 配置文件路径 (已废弃) */
  configPath?: string
  /** 是否开启开发模式 */
  devMode?: boolean
  /** 自定义组件配置列表 */
  components?: ComponentConfig[]
  /** 开发服务器配置 */
  devServer?: {
    enabled?: boolean
    url?: string
  }
}

const CustomComponentsPlugin: PluginCreator<CustomComponentsPluginOptions> = (
  options: CustomComponentsPluginOptions = {},
) => {
  const { devMode, components = [] } = options

  return {
    name: 'CustomComponentsPlugin',
    // meta: {
    //   title: '自定义组件插件',
    //   description: '加载和管理自定义组件',
    //   dependencies: ['@easy-editor/plugin-materials-dashboard'],
    // },
    // 初始化插件
    async init({ editor }) {
      // 创建加载器和注册表实例
      const componentLoader = new ComponentLoader(editor)
      const componentRegistry = new ComponentRegistry(editor, componentLoader)

      // 存储到编辑器上下文
      editor.set('customComponentLoader', componentLoader)
      editor.set('customComponentRegistry', componentRegistry)

      // 加载组件配置
      if (components.length > 0) {
        await componentRegistry.loadFromConfig({ components })
      }

      // 如果是开发模式并且启用了开发服务器，则连接开发服务器
      if (devMode && options.devServer?.enabled) {
        const { DevServer } = await import('./dev-server')
        const devServer = new DevServer(editor, componentRegistry)
        editor.set('customComponentDevServer', devServer)
        devServer.connect(options.devServer.url)

        // 注册退出清理
        editor.eventBus.on('beforeDestroy', () => {
          devServer.disconnect()
        })

        // 初始化开发工具包
        const { ComponentDevToolkit } = await import('./dev-toolkit')
        const devToolkit = new ComponentDevToolkit(editor, componentRegistry)
        editor.set('customComponentDevToolkit', devToolkit)

        // 将工具包挂载到全局，方便控制台调试
        if (typeof window !== 'undefined') {
          ;(window as any).__COMPONENT_DEV_TOOLKIT__ = devToolkit
          console.log('Custom Component Development Toolkit available as window.__COMPONENT_DEV_TOOLKIT__')
        }
      }

      // 暴露公共API
      const api = {
        // 注册组件
        registerComponent: async (componentConfig: ComponentConfig) => {
          return componentRegistry.register(componentConfig)
        },
        // 获取已注册组件
        getRegisteredComponents: () => {
          return componentRegistry.getAll()
        },
        // 刷新组件
        refreshComponent: (componentId: string) => {
          return componentRegistry.refresh(componentId)
        },
      }

      // 存储API
      editor.set('CustomComponentsPlugin', api)

      // return api
    },
  }
}

export default CustomComponentsPlugin
