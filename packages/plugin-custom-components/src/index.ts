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

      // 暴露公共API
      const api = {
        // 注册组件
        registerComponent: async componentConfig => {
          return componentRegistry.register(componentConfig)
        },
        // 获取已注册组件
        getRegisteredComponents: () => {
          return componentRegistry.getAll()
        },
        // 刷新组件
        refreshComponent: componentId => {
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
