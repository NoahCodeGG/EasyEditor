import type { Editor } from '@easy-editor/core'
import type React from 'react'
import { Suspense } from 'react'

// 组件包类型定义
export interface ComponentPackage {
  component: React.ComponentType<any>
  metadata: {
    componentName: string
    title: string
    description?: string
    icon?: string
    category?: string
    group?: string
    tags?: string[]
    [key: string]: any
  }
  props: Array<{
    name: string
    title: string
    setter: string
    defaultValue?: any
    [key: string]: any
  }>
}

export class ComponentLoader {
  private editor: Editor
  private componentCache = new Map<string, ComponentPackage>()

  constructor(editor: Editor) {
    this.editor = editor
  }

  // 加载组件包
  async loadComponentPackage(id: string, packagePath: string, devMode = false): Promise<ComponentPackage> {
    if (this.componentCache.has(id)) {
      return this.componentCache.get(id)!
    }

    try {
      // 开发模式和生产模式采用不同的加载策略
      let componentModule

      if (devMode && packagePath.startsWith('http')) {
        // 对于开发服务器的组件，使用远程加载
        componentModule = await this.loadRemoteComponentPackage(packagePath)
      } else {
        // 对于本地组件，使用动态导入
        componentModule = await this.loadLocalComponentPackage(packagePath)
      }

      // 使用默认导出
      const pkg = componentModule.default as ComponentPackage

      if (!pkg || !pkg.component || !pkg.metadata || !pkg.props) {
        throw new Error(`Invalid component package format from ${packagePath}`)
      }

      // 开发模式添加标记
      if (devMode) {
        pkg.metadata._devMode = true
        pkg.metadata._packagePath = packagePath
      }

      // 缓存组件包
      this.componentCache.set(id, pkg)

      return pkg
    } catch (error) {
      console.error(`Failed to load component from ${packagePath}`, error)
      throw new Error(`Failed to load component: ${(error as Error).message}`)
    }
  }

  // 加载远程组件包
  private async loadRemoteComponentPackage(url: string): Promise<any> {
    // 这里使用动态导入加载远程模块
    // 注意：这需要Vite或Webpack配置支持动态导入远程模块
    try {
      const module = await import(/* @vite-ignore */ url)
      return module
    } catch (error) {
      throw new Error(`Failed to load remote component: ${(error as Error).message}`)
    }
  }

  // 加载本地组件包
  private async loadLocalComponentPackage(packagePath: string): Promise<any> {
    try {
      // 动态导入本地模块
      const module = await import(/* @vite-ignore */ packagePath)
      return module
    } catch (error) {
      throw new Error(`Failed to load local component: ${(error as Error).message}`)
    }
  }

  // 创建组件包装器
  createComponentWrapper(Component: React.ComponentType<any>): React.ComponentType<any> {
    // 创建懒加载包装器
    return props => (
      <Suspense fallback={<div>Loading custom component...</div>}>
        <Component {...props} />
      </Suspense>
    )
  }

  // 刷新组件缓存
  invalidateCache(id: string): void {
    this.componentCache.delete(id)
  }

  // 清空所有缓存
  clearCache(): void {
    this.componentCache.clear()
  }
}
