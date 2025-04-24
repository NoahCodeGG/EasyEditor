import type { ComponentMetadata } from '../designer'
import type { ProjectSchema } from './schema'

type FilterOptional<T> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? K : never
    }[keyof T],
    undefined
  >
>

type FilterNotOptional<T> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K
    }[keyof T],
    undefined
  >
>

type PartialEither<T, K extends keyof any> = { [P in Exclude<keyof FilterOptional<T>, K>]-?: T[P] } & {
  [P in Exclude<keyof FilterNotOptional<T>, K>]?: T[P]
} & { [P in Extract<keyof T, K>]?: undefined }

type Object = {
  [name: string]: any
}

export type EitherOr<O extends Object, L extends string, R extends string> = (
  | PartialEither<Pick<O, L | R>, L>
  | PartialEither<Pick<O, L | R>, R>
) &
  Omit<O, L | R>

/**
 * 资产包协议
 */
export interface Assets {
  /**
   * 资产包协议版本号
   */
  version: string
  /**
   * 大包列表，external 与 package 的概念相似，融合在一起
   */
  packages?: Package[]
  /**
   * 所有组件的描述协议列表所有组件的列表
   */
  components: Array<ComponentDescription | RemoteComponentDescription>
  /**
   * 组件分类列表，用来描述物料面板
   * @deprecated 最新版物料面板已不需要此描述
   */
  componentList?: any[]
  /**
   * 业务组件分类列表，用来描述物料面板
   * @deprecated 最新版物料面板已不需要此描述
   */
  bizComponentList?: any[]
}

/**
 * 定义组件大包及 external 资源的信息
 * 应该被编辑器默认加载
 */
export type Package = EitherOr<
  {
    /**
     * npm 包名
     */
    package: string
    /**
     * 包唯一标识
     */
    id: string
    /**
     * 包版本号
     */
    version: string
    /**
     * 组件渲染态视图打包后的 CDN url 列表，包含 js 和 css
     */
    urls?: string[] | any
    /**
     * 组件编辑态视图打包后的 CDN url 列表，包含 js 和 css
     */
    editUrls?: string[] | any
    /**
     * 作为全局变量引用时的名称，和webpack output.library字段含义一样，用来定义全局变量名
     */
    library: string
    /**
     * @experimental
     *
     * TODO: 需推进提案 @度城
     */
    async?: boolean
    /**
     * 标识当前 package 从其他 package 的导出方式
     */
    exportMode?: 'functionCall'
    /**
     * 标识当前 package 是从 window 上的哪个属性导出来的
     */
    exportSourceLibrary?: any
    /**
     * 组件描述导出名字，可以通过 window[exportName] 获取到组件描述的 Object 内容；
     */
    exportName?: string
    /**
     * 低代码组件 schema 内容
     */
    schema?: ProjectSchema
  },
  'package',
  'id'
>

/**
 * 本地物料描述
 */
export interface ComponentDescription extends ComponentMetadata {
  /**
   * @todo 待补充文档 @jinchan
   */
  keywords: string[]
  /**
   * 替代 npm 字段的升级版本
   */
  reference?: Reference
}

/**
 * 远程物料描述
 */
export interface RemoteComponentDescription extends ComponentMetadata {
  /**
   * 组件描述导出名字，可以通过 window[exportName] 获取到组件描述的 Object 内容；
   */
  exportName?: string

  /**
   * 组件描述的资源链接；
   */
  url?: Asset

  /**
   * 组件 (库) 的 npm 信息；
   */
  package?: {
    npm?: string
  }

  /**
   * 替代 npm 字段的升级版本
   */
  reference?: Reference
}

/**
 * 资源引用信息，Npm 的升级版本，
 */
export type Reference = EitherOr<
  {
    /**
     * 引用资源的 id 标识
     */
    id: string
    /**
     * 引用资源的包名
     */
    package: string
    /**
     * 引用资源的导出对象中的属性值名称
     */
    exportName: string
    /**
     * 引用 exportName 上的子对象
     */
    subName: string
    /**
     * 引用的资源主入口
     */
    main?: string
    /**
     * 是否从引用资源的导出对象中获取属性值
     */
    destructuring?: boolean
    /**
     * 资源版本号
     */
    version: string
  },
  'package',
  'id'
>

export enum AssetLevel {
  // 环境依赖库 比如 react, react-dom
  Environment = 1,
  // 基础类库，比如 lodash deep fusion antd
  Library = 2,
  // 主题
  Theme = 3,
  // 运行时
  Runtime = 4,
  // 业务组件
  Components = 5,
  // 应用 & 页面
  App = 6,
}

export const AssetLevels = [
  AssetLevel.Environment,
  AssetLevel.Library,
  AssetLevel.Theme,
  AssetLevel.Runtime,
  AssetLevel.Components,
  AssetLevel.App,
]

export type URL = string

export enum AssetType {
  JSUrl = 'jsUrl',
  CSSUrl = 'cssUrl',
  CSSText = 'cssText',
  JSText = 'jsText',
  Bundle = 'bundle',
}

export interface AssetItem {
  type: AssetType
  content?: string | null
  device?: string
  level?: AssetLevel
  id?: string
  scriptType?: string
}

export type AssetList = Array<Asset | undefined | null>

export type Asset = AssetList | AssetBundle | AssetItem | URL

export interface AssetBundle {
  type: AssetType.Bundle
  level?: AssetLevel
  assets?: Asset | AssetList | null
}
