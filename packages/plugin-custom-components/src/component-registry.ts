import type { Editor } from '@easy-editor/core'
import type { ComponentLoader, ComponentPackage } from './component-loader'

// 组件配置类型
export interface ComponentConfig {
  id: string
  path: string
  devMode?: boolean
  version?: string
}

// 组件注册信息
export interface RegisteredComponent {
  id: string
  packagePath: string
  devMode: boolean
  metadata: any
  registeredAt: Date
}

export class ComponentRegistry {
  private editor: Editor
  private componentLoader: ComponentLoader
  private registeredComponents = new Map<string, RegisteredComponent>()

  constructor(editor: Editor, componentLoader: ComponentLoader) {
    this.editor = editor
    this.componentLoader = componentLoader
  }

  // 从配置文件加载组件
  async loadFromConfig(config: { components: ComponentConfig[] }): Promise<string[]> {
    const components = config.components || []
    const registerPromises = components.map(component => this.register(component))
    return Promise.all(registerPromises)
  }

  // 注册组件
  async register(config: ComponentConfig): Promise<string> {
    const { id, path: packagePath, devMode = false } = config

    // 检查是否已注册
    if (this.registeredComponents.has(id)) {
      console.warn(`Component ${id} is already registered, updating...`)
      // 刷新组件
      return this.refresh(id)
    }

    try {
      // 加载组件包
      const componentPackage = await this.componentLoader.loadComponentPackage(id, packagePath, devMode)

      // 注册到组件元数据管理器
      const componentId = await this.registerComponentMeta(id, componentPackage)

      // 添加到物料面板
      this.addToMaterialsPanel(componentPackage.metadata)

      // 记录注册信息
      this.registeredComponents.set(id, {
        id,
        packagePath,
        devMode,
        metadata: componentPackage.metadata,
        registeredAt: new Date(),
      })

      console.log(`Custom component ${id} registered successfully`)

      // 通知组件已注册
      this.editor.eventBus.emit('custom-component:registered', { id })

      return componentId
    } catch (error) {
      console.error(`Failed to register component ${id}: ${(error as Error).message}`)
      throw error
    }
  }

  // 刷新组件
  async refresh(id: string): Promise<string> {
    // 检查组件是否已注册
    if (!this.registeredComponents.has(id)) {
      throw new Error(`Component ${id} is not registered`)
    }

    const registeredInfo = this.registeredComponents.get(id)!

    // 清除缓存
    this.componentLoader.invalidateCache(id)

    try {
      // 重新加载组件包
      const componentPackage = await this.componentLoader.loadComponentPackage(
        id,
        registeredInfo.packagePath,
        registeredInfo.devMode,
      )

      // 更新组件元数据
      const componentId = await this.registerComponentMeta(id, componentPackage)

      // 更新注册信息
      this.registeredComponents.set(id, {
        ...registeredInfo,
        metadata: componentPackage.metadata,
      })

      console.log(`Custom component ${id} refreshed successfully`)

      // 通知组件已刷新
      this.editor.eventBus.emit('custom-component:refreshed', { id })

      return componentId
    } catch (error) {
      console.error(`Failed to refresh component ${id}: ${(error as Error).message}`)
      throw error
    }
  }

  // 注销组件
  async unregister(id: string): Promise<boolean> {
    if (!this.registeredComponents.has(id)) {
      return false
    }

    // 从组件元数据管理器中移除
    const componentMetaManager = this.editor.get('componentMetaManager')
    if (componentMetaManager) {
      componentMetaManager.removeComponentMeta(id)
    }

    // 从物料面板移除
    this.removeFromMaterialsPanel(id)

    // 清除缓存
    this.componentLoader.invalidateCache(id)

    // 移除注册信息
    this.registeredComponents.delete(id)

    // 通知组件已注销
    this.editor.eventBus.emit('custom-component:unregistered', { id })

    return true
  }

  // 获取所有注册的组件
  getAll(): RegisteredComponent[] {
    return Array.from(this.registeredComponents.values())
  }

  // 获取特定组件
  get(id: string): RegisteredComponent | undefined {
    return this.registeredComponents.get(id)
  }

  // 注册到组件元数据管理器
  private async registerComponentMeta(id: string, componentPackage: ComponentPackage): Promise<string> {
    const componentMetaManager = this.editor.get('componentMetaManager')
    if (!componentMetaManager) {
      throw new Error('Component meta manager not found')
    }

    const { component, metadata, props } = componentPackage

    // 创建组件包装器
    const WrappedComponent = this.componentLoader.createComponentWrapper(component)

    // 注册组件元数据
    componentMetaManager.registerComponentMeta(id, {
      ...metadata,
      component: WrappedComponent,
      // 合并配置
      configure: {
        ...(metadata.configure || {}),
        props: [
          ...((metadata.configure && metadata.configure.props) || []),
          ...props.map(prop => ({
            name: prop.name,
            setter: prop.setter,
            extraProps: {
              title: prop.title,
              defaultValue: prop.defaultValue,
            },
          })),
        ],
      },
    })

    return id
  }

  // 添加到物料面板
  private addToMaterialsPanel(metadata: any): void {
    // 获取物料面板插件
    const materialsDashboard = this.editor.get('MaterialsDashboardPlugin')
    if (!materialsDashboard) {
      console.warn('Materials dashboard plugin not found, cannot add component to panel')
      return
    }

    // 添加到物料面板
    materialsDashboard.addMaterial({
      componentName: metadata.componentName,
      title: metadata.title,
      icon: metadata.icon || 'box',
      group: metadata.group || 'custom',
      category: metadata.category || 'components',
      tags: metadata.tags || ['custom'],
    })
  }

  // 从物料面板移除
  private removeFromMaterialsPanel(id: string): void {
    // 获取物料面板插件
    const materialsDashboard = this.editor.get('MaterialsDashboardPlugin')
    if (!materialsDashboard) {
      return
    }

    // 从物料面板移除
    materialsDashboard.removeMaterial(id)
  }
}
