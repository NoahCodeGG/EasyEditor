import { type Designer, type Point, type Simulator, createEventBus, makeEventsHandler } from '@easy-editor/core'

// 拖动缩放
export default class DragResizeEngine {
  private emitter = createEventBus('DragResizeEngine')

  private dragResizing = false

  private designer: Designer

  constructor(designer: Designer) {
    this.designer = designer
  }

  isDragResizing() {
    return this.dragResizing
  }

  /**
   * drag reszie from
   * @param shell
   * @param direction n/s/e/w
   * @param boost (e: MouseEvent) => VE.Node
   */
  from(shell: HTMLElement, direction: string, boost: (e: MouseEvent) => any) {
    let node: any
    let startEvent: Point

    if (!shell) {
      return () => {}
    }

    const move = (e: MouseEvent) => {
      const x = createResizeEvent(e)
      const moveX = x.clientX - startEvent.clientX
      const moveY = x.clientY - startEvent.clientY

      this.emitter.emit('resize', { e, direction, node, moveX, moveY })
    }

    const masterSensors = this.getMasterSensors()

    const createResizeEvent = (e: MouseEvent | DragEvent): Point => {
      const sourceDocument = e.view?.document

      if (!sourceDocument || sourceDocument === document) {
        return e
      }
      const srcSim = masterSensors.find(sim => sim.contentDocument === sourceDocument)
      if (srcSim) {
        return srcSim.viewport.toGlobalPoint(e)
      }
      return e
    }

    const over = (e: MouseEvent) => {
      const handleEvents = makeEventsHandler(e, masterSensors)
      handleEvents(doc => {
        doc.removeEventListener('mousemove', move, true)
        doc.removeEventListener('mouseup', over, true)
      })

      this.dragResizing = false
      this.designer.detecting.enable = true
      // cursor.release()

      this.emitter.emit('resizeEnd', { e, direction, node })
    }

    const mousedown = (e: MouseEvent) => {
      node = boost(e)
      startEvent = createResizeEvent(e)
      const handleEvents = makeEventsHandler(e, masterSensors)
      handleEvents(doc => {
        doc.addEventListener('mousemove', move, true)
        doc.addEventListener('mouseup', over, true)
      })

      this.emitter.emit('resizeStart', { e, direction, node })
      this.dragResizing = true
      this.designer.detecting.enable = false
      // cursor.addState('ew-resize')
    }
    shell.addEventListener('mousedown', mousedown)
    return () => {
      shell.removeEventListener('mousedown', mousedown)
    }
  }

  onResizeStart(func: (evt: { e: MouseEvent; direction: string; node: any }) => any) {
    this.emitter.on('resizeStart', func)
    return () => {
      this.emitter.off('resizeStart', func)
    }
  }

  onResize(func: (evt: { e: MouseEvent; direction: string; node: any; moveX: number; moveY: number }) => any) {
    this.emitter.on('resize', func)
    return () => {
      this.emitter.off('resize', func)
    }
  }

  onResizeEnd(func: (evt: { e: MouseEvent; direction: string; node: any }) => any) {
    this.emitter.on('resizeEnd', func)
    return () => {
      this.emitter.off('resizeEnd', func)
    }
  }

  private getMasterSensors(): Simulator[] {
    return this.designer.project.documents
      .map(doc => {
        if (doc.opened && doc.simulator?.sensorAvailable) {
          return doc.simulator
        }
        return null
      })
      .filter(Boolean) as any
  }
}
