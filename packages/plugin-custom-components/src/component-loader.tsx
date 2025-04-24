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

      if (!pkg || !pkg.component || !pkg.metadata) {
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
    // 添加缓存破坏参数，确保在开发模式下始终加载最新版本
    const cacheBusterUrl = `${url}?t=${Date.now()}`

    try {
      // 动态导入远程模块
      const module: any = await import(/* @vite-ignore */ cacheBusterUrl)
      return module
    } catch (error) {
      console.error(`[Component Loader] Remote loading error:`, error)

      // 提供更有用的调试信息
      if ((error as Error).message.includes('CORS')) {
        throw new Error(
          'CORS error loading component from ' + url + '. Ensure the server allows cross-origin requests.',
        )
      } else if ((error as Error).message.includes('module not found')) {
        throw new Error('Module not found at ' + url + '. Check if the URL is correct and the server is running.')
      }

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
