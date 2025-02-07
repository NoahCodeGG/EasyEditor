import { createLogger } from './logger'

type EventType = string | symbol
type Events = Record<EventType, unknown>
type Handler = (event: Events[keyof Events]) => void

class EventEmitter {
  all = new Map<EventType, Array<Handler>>()

  on<Key extends keyof Events>(type: Key, handler: Handler) {
    const handlers: Array<Handler> | undefined = this.all!.get(type)
    if (handlers) {
      handlers.push(handler)
    } else {
      this.all!.set(type, [handler])
    }
  }

  off<Key extends keyof Events>(type: Key, handler?: Handler) {
    const handlers: Array<Handler> | undefined = this.all!.get(type)
    if (handlers) {
      if (handler) {
        handlers.splice(handlers.indexOf(handler) >>> 0, 1)
      } else {
        this.all!.set(type, [])
      }
    }
  }

  emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
    const handlers = this.all!.get(type)
    if (handlers) {
      handlers.slice().map(handler => {
        handler(evt!)
      })
    }
  }
}

export class EventBus {
  private readonly eventEmitter: EventEmitter
  private readonly name?: string

  private logger = createLogger('EventBus')

  /**
   * 内核触发的事件名
   */
  readonly names = []

  constructor(emitter: EventEmitter, name?: string) {
    this.eventEmitter = emitter
    this.name = name
  }

  private getMsgPrefix(type: string): string {
    if (this.name && this.name.length > 0) {
      return `[${this.name}][event-${type}]`
    }
    return `[*][event-${type}]`
  }

  /**
   * 监听事件
   * @param event 事件名称
   * @param listener 事件回调
   */
  on(event: string, listener: (...args: any[]) => void): () => void {
    this.eventEmitter.on(event, listener)
    this.logger.log(`${this.getMsgPrefix('on')} ${event}`)
    return () => {
      this.off(event, listener)
    }
  }

  /**
   * 取消监听事件
   * @param event 事件名称
   * @param listener 事件回调
   */
  off(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(event, listener)
    this.logger.log(`${this.getMsgPrefix('off')} ${event}`)
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 事件参数
   * @returns
   */
  emit(event: string, ...args: any[]) {
    this.eventEmitter.emit(event, ...args)
    this.logger.log(`${this.getMsgPrefix('emit')} name: ${event}, args: `, ...args)
  }
}

/**
 * 创建一个独立模块事件总线
 * @param name 模块名称
 */
export const createEventBus = (name: string): EventBus => {
  const emitter = new EventEmitter()
  return new EventBus(emitter, name)
}
