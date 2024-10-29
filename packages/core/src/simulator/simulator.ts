import type { ComponentInstance, Designer } from '@/designer'
import type { Project } from '@/project'
import { createEventBus } from '@/utils'
import { computed, observable } from 'mobx'
import Viewport from './viewport'

type DesignMode = 'live' | 'design' | 'preview'

export interface SimulatorProps {
  // 从 documentModel 上获取
  // suspended?: boolean;
  designMode?: DesignMode
  // device?: 'mobile' | 'iphone' | string;
  // deviceClassName?: string;
  // environment?: Asset;
  // // @TODO 补充类型
  // /** @property 请求处理器配置 */
  // requestHandlersMap?: any;
  // extraEnvironment?: Asset;
  // library?: LibraryItem[];
  // utilsMetadata?: UtilsMetadata;
  // simulatorUrl?: Asset;
  // theme?: Asset;
  // componentsAsset?: Asset;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: any
}

export class Simulator {
  readonly emitter = createEventBus('Simulator')

  isSimulator = true

  readonly project: Project

  readonly designer: Designer

  readonly viewport = new Viewport()

  autoRender = true

  @computed get designMode(): DesignMode {
    return this.get('designMode') || 'design'
  }

  @observable.ref _props: SimulatorProps = {}

  @observable.ref private _contentWindow?: Window

  get contentWindow() {
    return this._contentWindow
  }

  @observable.ref private _contentDocument?: Document

  get contentDocument() {
    return this._contentDocument
  }

  @observable private instancesMap: {
    [docId: string]: Map<string, ComponentInstance[]>
  } = {}

  private _sensorAvailable = true

  get sensorAvailable(): boolean {
    return this._sensorAvailable
  }

  private sensing = false

  constructor(project: Project, designer: Designer) {
    this.project = project
    this.designer = designer
  }

  setProps(props: SimulatorProps) {
    this._props = props
  }

  set(key: string, value: any) {
    this._props = {
      ...this._props,
      [key]: value,
    }
  }

  get(key: string): any {
    return this._props[key]
  }

  mountViewport(viewport: HTMLElement | null) {
    this.viewport.mount(viewport)
  }
}

export function isSimulator(obj: any): obj is Simulator {
  return obj && obj.isSimulator
}
