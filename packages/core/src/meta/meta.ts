import type { Node, NodeSchema, Prop } from '@/document'

export interface ComponentMetadata {
  /**
   * 组件名
   */
  componentName: string

  /**
   * unique id
   */
  uri?: string

  /**
   * title or description
   */
  title?: string

  /**
   * svg icon for component
   */
  icon?: string

  /**
   * 组件标签
   */
  tags?: string[]

  /**
   * 组件描述
   */
  description?: string

  /**
   * 组件文档链接
   */
  docUrl?: string

  /**
   * 组件快照
   */
  screenshot?: string

  /**
   * 组件研发模式
   */
  devMode?: 'proCode' | 'lowCode'

  /**
   * 组件属性信息
   */
  props?: PropConfig[]

  /**
   * 编辑体验增强
   */
  // configure?: FieldConfig[] | Configure
  configure?: Configure

  /**
   * @todo 待补充文档
   */
  // schema?: ComponentSchema

  /**
   * 可用片段
   */
  snippets?: Snippet[]

  /**
   * 一级分组
   */
  group?: string

  /**
   * 二级分组
   */
  category?: string

  /**
   * 组件优先级排序
   */
  priority?: number

  [key: string]: any
}

export interface Snippet {
  /**
   * 组件分类 title
   */
  title?: string
  /**
   * snippet 截图
   */
  screenshot?: string
  /**
   * snippet 打标
   *
   * @deprecated 暂未使用
   */
  label?: string
  /**
   * 待插入的 schema
   */
  schema?: NodeSchema
}

export interface Configure {
  /**
   * 属性面板配置
   */
  props?: FieldConfig[]

  /**
   * 组件能力配置
   */
  component?: ComponentConfigure

  /**
   * 通用扩展面板支持性配置
   */
  supports?: ConfigureSupport

  /**
   * 高级特性配置
   */
  advanced?: Advanced
}

export interface ComponentConfigure {
  /**
   * 是否容器组件
   */
  isContainer?: boolean

  /**
   * 组件是否带浮层，浮层组件拖入设计器时会遮挡画布区域，此时应当辅助一些交互以防止阻挡
   */
  isModal?: boolean

  /**
   * 是否存在渲染的根节点
   */
  isNullNode?: boolean

  /**
   * 组件树描述信息
   */
  descriptor?: string

  /**
   * 是否是最小渲染单元
   * 最小渲染单元下的组件渲染和更新都从单元的根节点开始渲染和更新。如果嵌套了多层最小渲染单元，渲染会从最外层的最小渲染单元开始渲染。
   */
  isMinimalRenderUnit?: boolean

  /**
   * 组件选中框的 cssSelector
   */
  rootSelector?: string

  /**
   * 禁用的行为，可以为 `'copy'`, `'move'`, `'remove'` 或它们组成的数组
   */
  disableBehaviors?: string[] | string

  /**
   * 用于详细配置上述操作项的内容
   */
  actions?: ComponentAction[]
}

export interface ComponentAction {
  /**
   * behaviorName
   */
  name: string

  /**
   * 菜单名称
   */
  content: string

  /**
   * 子集
   */
  items?: ComponentAction[]

  /**
   * 显示与否
   * always: 无法禁用
   */
  condition?: boolean | ((currentNode: any) => boolean) | 'always'

  /**
   * 显示在工具条上
   */
  important?: boolean
}

export interface ConfigureSupport {
  /**
   * 支持事件列表
   */
  events?: ConfigureSupportEvent[]

  /**
   * 支持 className 设置
   */
  className?: boolean

  /**
   * 支持样式设置
   */
  style?: boolean

  /**
   * 支持生命周期设置
   */
  lifecycles?: any[]

  // general?: boolean;
  /**
   * 支持循环设置
   */
  loop?: boolean

  /**
   * 支持条件式渲染设置
   */
  condition?: boolean
}

export type ConfigureSupportEvent = string | ConfigureSupportEventConfig

export interface ConfigureSupportEventConfig {
  name: string
  propType?: PropType
  description?: string
  template?: string
}

export interface Advanced {
  /**
   * 配置 callbacks 可捕获引擎抛出的一些事件，例如 onNodeAdd、onResize 等
   * callbacks/hooks which can be used to do
   * things on some special ocations like onNodeAdd or onResize
   */
  callbacks?: Callbacks

  /**
   * 拖入容器时，自动带入 children 列表
   */
  initialChildren?: NodeSchema[] | ((target: Node) => NodeSchema[])
}

export interface Callbacks {
  // hooks
  onMouseDownHook?: (e: MouseEvent, currentNode: Node | null) => any
  onDblClickHook?: (e: MouseEvent, currentNode: Node | null) => any
  onClickHook?: (e: MouseEvent, currentNode: Node | null) => any
  // onLocateHook?: (e: any, currentNode: any) => any;
  // onAcceptHook?: (currentNode: any, locationData: any) => any;
  onMoveHook?: (currentNode: Node) => boolean
  // thinkof 限制性拖拽
  onHoverHook?: (currentNode: Node) => boolean

  /** 选中 hook，如果返回值是 false，可以控制组件不可被选中 */
  onSelectHook?: (currentNode: Node) => boolean
  onChildMoveHook?: (childNode: Node, currentNode: Node) => boolean

  // events
  onNodeRemove?: (removedNode: Node | null, currentNode: Node | null) => void
  onNodeAdd?: (addedNode: Node | null, currentNode: Node | null) => void
  onSubtreeModified?: (currentNode: Node, options: any) => void
  onResize?: (
    e: MouseEvent & {
      trigger: string
      deltaX?: number
      deltaY?: number
    },
    currentNode: any,
  ) => void
  onResizeStart?: (
    e: MouseEvent & {
      trigger: string
      deltaX?: number
      deltaY?: number
    },
    currentNode: any,
  ) => void
  onResizeEnd?: (
    e: MouseEvent & {
      trigger: string
      deltaX?: number
      deltaY?: number
    },
    currentNode: Node,
  ) => void
}

export interface PropConfig {
  /**
   * 属性名称
   */
  name: string
  /**
   * 属性类型
   */
  propType: PropType
  /**
   * 属性描述
   */
  description?: string
  /**
   * 属性默认值
   */
  defaultValue?: any
}

export type PropType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'symbol' | 'any'

export type SettingField = Prop

export interface FieldExtraProps {
  /**
   * 是否必填参数
   */
  isRequired?: boolean

  /**
   * default value of target prop for setter use
   */
  defaultValue?: any

  /**
   * get value for field
   */
  getValue?: (target: SettingField, fieldValue: any) => any

  /**
   * set value for field
   */
  setValue?: (target: SettingField, value: any) => void

  /**
   * the field conditional show, is not set always true
   * @default undefined
   */
  condition?: (target: SettingField) => boolean

  /**
   * 配置当前 prop 是否忽略默认值处理逻辑，如果返回值是 true 引擎不会处理默认值
   * @returns boolean
   */
  ignoreDefaultValue?: (target: SettingField) => boolean

  /**
   * autorun when something change
   */
  autorun?: (target: SettingField) => void

  /**
   * default collapsed when display accordion
   */
  defaultCollapsed?: boolean

  /**
   * important field
   */
  important?: boolean

  /**
   * internal use
   */
  forceInline?: number

  /**
   * 是否支持变量配置
   */
  supportVariable?: boolean

  /**
   * compatiable vision display
   */
  display?: 'accordion' | 'inline' | 'block' | 'plain' | 'popup' | 'entry'

  /**
   * onChange 事件
   */
  onChange?: (value: any, field: any) => void
}

export interface FieldConfig extends FieldExtraProps {
  /**
   * 面板配置隶属于单个 field 还是分组
   */
  type?: 'field' | 'group'

  /**
   * the name of this setting field, which used in quickEditor
   */
  name?: string | number

  /**
   * the field title
   * @default sameas .name
   */
  title?: string

  /**
   * 单个属性的 setter 配置
   *
   * the field body contains when .type = 'field'
   */
  setter?: SetterType

  /**
   * the setting items which group body contains when .type = 'group'
   */
  items?: FieldConfig[]

  /**
   * extra props for field
   * 其他配置属性（不做流通要求）
   */
  extraProps?: FieldExtraProps
}

export type SetterType = SetterConfig | SetterConfig[] | string

export interface SetterConfig {
  // if *string* passed must be a registered Setter Name
  /**
   * 配置设置器用哪一个 setter
   */
  componentName: string

  /**
   * 传递给 setter 的属性
   *
   * the props pass to Setter Component
   */
  props?: Record<string, unknown> | ((target: SettingField) => Record<string, unknown>)

  /**
   * 是否必填？
   *
   * ArraySetter 里有个快捷预览，可以在不打开面板的情况下直接编辑
   */
  isRequired?: boolean

  /**
   * Setter 的初始值
   *
   * @todo initialValue 可能要和 defaultValue 二选一
   */
  initialValue?: any | ((target: SettingField) => any)

  defaultValue?: any

  // for MixedSetter
  /**
   * 给 MixedSetter 时切换 Setter 展示用的
   */
  title?: string

  // for MixedSetter check this is available
  /**
   * 给 MixedSetter 用于判断优先选中哪个
   */
  condition?: (target: SettingField) => boolean

  /**
   * 给 MixedSetter，切换值时声明类型
   *
   * @todo 物料协议推进
   */
  valueType?: any[]

  // 标识是否为动态 setter，默认为 true
  isDynamic?: boolean
}

// export type ComponentType<T> = React.ComponentType<T>
export type ComponentType<T> = any

export type Component = ComponentType<any> | object
