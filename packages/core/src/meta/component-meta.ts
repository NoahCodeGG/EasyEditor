import { computed } from 'mobx'
import type { Designer } from '../designer'
import { createEventBus } from '../utils'
import type { ComponentMetadata, FieldConfig } from './meta'

export enum COMPONENT_META_EVENT {
  CHANGE = 'componentMeta:metadata.change',
}

export class ComponentMeta {
  readonly isComponentMeta = true

  private emitter = createEventBus('ComponentMeta')

  private _componentName?: string

  get componentName(): string {
    return this._componentName!
  }

  private _isContainer?: boolean

  get isContainer(): boolean {
    return this._isContainer! || this.isRootComponent()
  }

  get isMinimalRenderUnit(): boolean {
    return this._isMinimalRenderUnit || false
  }

  private _isModal?: boolean

  get isModal(): boolean {
    return this._isModal!
  }

  private _descriptor?: string

  get descriptor(): string | undefined {
    return this._descriptor
  }

  private _rootSelector?: string

  get rootSelector(): string | undefined {
    return this._rootSelector
  }

  private _metadata?: ComponentMetadata

  get configure(): FieldConfig[] {
    const config = this._metadata?.configure
    return config?.props || []
  }

  private _isTopFixed?: boolean

  get isTopFixed(): boolean {
    return !!this._isTopFixed
  }

  private _title?: string

  private _isMinimalRenderUnit?: boolean

  get title(): string {
    return this._title || this.componentName
  }

  @computed get icon() {
    return this._metadata?.icon
  }

  private _acceptable?: boolean

  get acceptable(): boolean {
    return this._acceptable!
  }

  constructor(
    readonly designer: Designer,
    metadata: ComponentMetadata,
  ) {
    this.parseMetadata(metadata)
  }

  private parseMetadata(metadata: ComponentMetadata) {
    const { componentName, npm, ...others } = metadata
    this._metadata = metadata
    this._componentName = componentName

    const { title } = this._metadata
    if (title) {
      this._title = title
    }

    const { configure = {} } = this._metadata
    this._acceptable = false

    const { component } = configure
    if (component) {
      this._isContainer = !!component.isContainer
      this._isModal = !!component.isModal
      this._descriptor = component.descriptor
      this._rootSelector = component.rootSelector
      this._isMinimalRenderUnit = component.isMinimalRenderUnit
    } else {
      this._isContainer = false
      this._isModal = false
    }
    this.emitter.emit('metadata_change')
  }

  refreshMetadata() {
    this.parseMetadata(this.getMetadata())
  }

  isRootComponent(includeBlock = true): boolean {
    return (
      this.componentName === 'Page' ||
      this.componentName === 'Component' ||
      (includeBlock && this.componentName === 'Block')
    )
  }

  // @computed get availableActions() {
  //   // eslint-disable-next-line prefer-const
  //   let { disableBehaviors, actions } = this._metadata?.configure?.component || {}
  //   const disabled =
  //     ensureAList(disableBehaviors) || (this.isRootComponent(false) ? ['copy', 'remove', 'lock', 'unlock'] : null)
  //   actions = this.designer.componentActions.actions.concat(
  //     this.designer.getGlobalComponentActions() || [],
  //     actions || [],
  //   )

  //   if (disabled) {
  //     if (disabled.includes('*')) {
  //       return actions.filter(action => action.condition === 'always')
  //     }
  //     return actions.filter(action => disabled.indexOf(action.name) < 0)
  //   }
  //   return actions
  // }

  setMetadata(metadata: ComponentMetadata) {
    this.parseMetadata(metadata)
  }

  getMetadata() {
    return this._metadata!
  }

  onMetadataChange(fn: (args: any) => void) {
    this.emitter.on(COMPONENT_META_EVENT.CHANGE, fn)
    return () => {
      this.emitter.off(COMPONENT_META_EVENT.CHANGE, fn)
    }
  }
}

export function isComponentMeta(obj: any): obj is ComponentMeta {
  return obj && obj.isComponentMeta
}
