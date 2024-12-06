import type { Editor, Node, SetterManager } from '../..'
import type { Designer } from '../designer'
import type { SettingField } from './setting-field'

export interface ISettingEntry {
  readonly designer: Designer | undefined

  readonly id: string

  /**
   * 同样类型的节点
   */
  readonly isSameComponent: boolean

  /**
   * 一个
   */
  readonly isSingle: boolean

  /**
   * 多个
   */
  readonly isMultiple: boolean

  /**
   * 编辑器引用
   */
  readonly editor: Editor

  readonly setters: SetterManager

  /**
   * 取得子项
   */
  get: (propName: string | number) => SettingField | null

  readonly nodes: Node[]

  // @todo 补充 node 定义
  /**
   * 获取 node 中的第一项
   */
  getNode: () => any
}
