import { createEventBus, createLogger } from '@/utils'

export class Designer {
  private logger = createLogger('Designer')
  private emitter = createEventBus('Designer')

  postEvent(event: string, ...args: any[]) {
    this.emitter.emit(`designer:${event}`, ...args)
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(`designer:${event}`, listener)
  }

  offEvent(event: string, listener: (...args: any[]) => void) {
    this.emitter.off(`designer:${event}`, listener)
  }
}
