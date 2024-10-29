import type { Node, NodeSchema } from '@/document'
import { type Simulator, isSimulator } from '@/simulator'
import { createEventBus, cursor } from '@/utils'
import { setNativeSelection } from '@/utils/navtive-selection'
import { observable } from 'mobx'
import type { Designer } from '.'
import type { DropLocation, LocateEvent } from './location'

export class DragObject {
  data: NodeSchema | NodeSchema[] | undefined
  nodes: (Node | null)[] | undefined
}

export enum DragObjectType {
  Node = 'node',
  NodeData = 'nodedata',
}

export interface DragNodeObject<T = Node> {
  type: DragObjectType.Node
  nodes: T[]
}

export interface DragNodeDataObject {
  type: DragObjectType.NodeData
  data: NodeSchema | NodeSchema[]
  thumbnail?: string
  description?: string
  [extra: string]: any
}

export type ComponentInstance = Element | object

interface NodeInstance<T = ComponentInstance, N = Node> {
  docId: string
  nodeId: string
  instance: T
  node?: N | null
}

export interface Sensor<T = Node> {
  /**
   * whether the sensor is available
   */
  readonly sensorAvailable: boolean

  /**
   * fix location event, add canvasX,canvasY
   */
  fixEvent(e: LocateEvent): LocateEvent

  /**
   * locate and activate
   */
  locate(e: LocateEvent): DropLocation | undefined | null

  /**
   * whether enter the sensitive area
   */
  isEnter(e: LocateEvent): boolean

  /**
   * deactivate
   */
  deactiveSensor(): void

  /**
   * get node instance from element
   */
  getNodeInstanceFromElement?: (e: Element | null) => NodeInstance<ComponentInstance, Node> | null
}

export const isDragNodeObject = (obj: any): obj is DragNodeObject => {
  return obj && obj.type === DragObjectType.Node
}

export const isDragNodeDataObject = (obj: any): obj is DragNodeDataObject => {
  return obj && obj.type === DragObjectType.NodeData
}

export const isLocateEvent = (e: any): e is LocateEvent => {
  return e && e.type === 'LocateEvent'
}

export const isDragEvent = (e: any): e is DragEvent => {
  return e?.type?.startsWith('drag')
}

export const isInvalidPoint = (e: any, last: any): boolean => {
  return (
    e.clientX === 0 &&
    e.clientY === 0 &&
    last &&
    (Math.abs(last.clientX - e.clientX) > 5 || Math.abs(last.clientY - e.clientY) > 5)
  )
}

export const isSameAs = (e1: MouseEvent | DragEvent, e2: MouseEvent | DragEvent): boolean => {
  return e1.clientY === e2.clientY && e1.clientX === e2.clientX
}

const SHAKE_DISTANCE = 4

/**
 * mouse shake check
 */
export const isShaken = (e1: MouseEvent | DragEvent, e2: MouseEvent | DragEvent): boolean => {
  if ((e1 as any).shaken) {
    return true
  }
  if (e1.target !== e2.target) {
    return true
  }
  return (e1.clientY - e2.clientY) ** 2 + (e1.clientX - e2.clientX) ** 2 > SHAKE_DISTANCE
}

export const setShaken = (e: any) => {
  e.shaken = true
}

export const getSourceSensor = (dragObject: DragObject): Simulator | null => {
  if (!isDragNodeObject(dragObject)) {
    return null
  }
  return dragObject.nodes[0]?.document?.simulator || null
}

export class Dragon {
  emitter = createEventBus('Dragon')

  private sensors: Sensor[] = []

  /** current active sensor */
  @observable.ref private _activeSensor: Sensor | undefined

  get activeSensor() {
    return this._activeSensor
  }

  @observable.ref private _dragging = false

  get dragging() {
    return this._dragging
  }

  constructor(readonly designer: Designer) {}

  /**
   * Quick listen a shell(container element) drag behavior
   * @param shell container element
   * @param boost boost got a drag object
   */
  from(shell: Element, boost: (e: MouseEvent) => DragObject | null) {
    const mousedown = (e: MouseEvent) => {
      // ESC or RightClick
      if (e.which === 3 || e.button === 2) {
        return
      }

      // Get a new node to be dragged
      const dragObject = boost(e)
      if (!dragObject) {
        return
      }

      this.boost(dragObject, e)
    }

    shell.addEventListener('mousedown', mousedown as any)

    return () => {
      shell.removeEventListener('mousedown', mousedown as any)
    }
  }

  /**
   * boost your dragObject for dragging(flying) 发射拖拽对象
   * @param dragObject 拖拽对象
   * @param boostEvent 拖拽初始时事件
   */
  boost(dragObject: DragObject, boostEvent: MouseEvent | DragEvent) {
    const { designer } = this
    const masterSensors = this.getMasterSensors()
    const handleEvents = makeEventsHandler(boostEvent, masterSensors)
    const newNode = !isDragNodeObject(dragObject)
    const isBoostFromDragAPI = isDragEvent(boostEvent)
    let lastSensor: Sensor | undefined

    this._dragging = false

    /**
     * When you press esc while dragging, it will stop dnd
     * @param e
     */
    const checkesc = (e: KeyboardEvent) => {
      if (e.keyCode === 27) {
        designer.clearLocation()
        over()
      }
    }

    let lastArrive: any
    const drag = (e: MouseEvent | DragEvent) => {
      if (isInvalidPoint(e, lastArrive)) return

      if (lastArrive && isSameAs(e, lastArrive)) {
        lastArrive = e
        return
      }
      lastArrive = e

      const locateEvent = createLocateEvent(e)
      const sensor = chooseSensor(locateEvent)

      if (sensor) {
        sensor.fixEvent(locateEvent)
        sensor.locate(locateEvent)
      } else {
        designer.clearLocation()
      }
      this.emitter.emit('drag', locateEvent)
    }

    const dragstart = () => {
      this._dragging = true
      setShaken(boostEvent)
      const locateEvent = createLocateEvent(boostEvent)
      if (newNode) {
        this.setCopyState(true)
      } else {
        chooseSensor(locateEvent)
      }
      this.setDraggingState(true)
      // ESC cancel drag
      if (!isBoostFromDragAPI) {
        handleEvents(doc => {
          doc.addEventListener('keydown', checkesc, false)
        })
      }

      this.emitter.emit('dragstart', locateEvent)
    }

    // route: drag-move
    const move = (e: MouseEvent | DragEvent) => {
      if (isBoostFromDragAPI) {
        e.preventDefault()
      }
      if (this._dragging) {
        // process dragging
        drag(e)
        return
      }

      // first move check is shaken
      if (isShaken(boostEvent, e)) {
        // is shaken dragstart
        dragstart()
        drag(e)
      }
    }

    let didDrop = true

    const drop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      didDrop = true
    }

    // end-tail drag process
    const over = (e?: any) => {
      if (e && isDragEvent(e)) {
        e.preventDefault()
      }
      if (lastSensor) {
        lastSensor.deactiveSensor()
      }
      /* istanbul ignore next */
      if (isBoostFromDragAPI) {
        if (!didDrop) {
          designer.clearLocation()
        }
      } else {
        this.setNativeSelection(true)
      }
      this.clearState()

      let exception: unknown
      if (this._dragging) {
        this._dragging = false
        try {
          this.emitter.emit('dragend', { dragObject })
        } catch (ex) {
          exception = ex
        }
      }
      designer.clearLocation()

      handleEvents(doc => {
        if (isBoostFromDragAPI) {
          doc.removeEventListener('dragover', move, true)
          doc.removeEventListener('dragend', over, true)
          doc.removeEventListener('drop', drop, true)
        } else {
          doc.removeEventListener('mousemove', move, true)
          doc.removeEventListener('mouseup', over, true)
        }
        doc.removeEventListener('mousedown', over, true)
        doc.removeEventListener('keydown', checkesc, false)
      })

      if (exception) {
        throw exception
      }
    }

    // create drag locate event
    const createLocateEvent = (e: MouseEvent | DragEvent): LocateEvent => {
      const evt: any = {
        type: 'LocateEvent',
        dragObject,
        target: e.target,
        originalEvent: e,
      }

      const sourceDocument = e.view?.document

      // event from current document
      if (!sourceDocument || sourceDocument === document) {
        evt.globalX = e.clientX
        evt.globalY = e.clientY
      } /* istanbul ignore next */ else {
        // event from simulator sandbox
        let srcSim: Simulator | undefined
        const lastSim = lastSensor && isSimulator(lastSensor) ? lastSensor : null
        // check source simulator
        if (lastSim && lastSim.contentDocument === sourceDocument) {
          srcSim = lastSim
        } else {
          srcSim = masterSensors.find(sim => sim.contentDocument === sourceDocument)
          if (!srcSim && lastSim) {
            srcSim = lastSim
          }
        }
        if (srcSim) {
          // transform point by simulator
          const g = srcSim.viewport.toGlobalPoint(e)
          evt.globalX = g.clientX
          evt.globalY = g.clientY
          evt.canvasX = e.clientX
          evt.canvasY = e.clientY
          evt.sensor = srcSim
        } else {
          // this condition will not happen, just make sure ts ok
          evt.globalX = e.clientX
          evt.globalY = e.clientY
        }
      }
      return evt
    }

    const sourceSensor = getSourceSensor(dragObject)
    // /* istanbul ignore next */
    const chooseSensor = (e: LocateEvent) => {
      // this.sensors will change on dragstart
      const sensors: Sensor[] = this.sensors.concat(masterSensors as Sensor[])
      let sensor = e.sensor && e.sensor.isEnter(e) ? e.sensor : sensors.find(s => s.sensorAvailable && s.isEnter(e))
      if (!sensor) {
        // TODO: enter some area like componentspanel cancel
        if (lastSensor) {
          sensor = lastSensor
        } else if (e.sensor) {
          sensor = e.sensor
        } else if (sourceSensor) {
          sensor = sourceSensor
        }
      }
      if (sensor !== lastSensor) {
        if (lastSensor) {
          lastSensor.deactiveSensor()
        }
        lastSensor = sensor
      }
      if (sensor) {
        e.sensor = sensor
        sensor.fixEvent(e)
      }
      this._activeSensor = sensor
      return sensor
    }

    /* istanbul ignore next */
    if (isDragEvent(boostEvent)) {
      const { dataTransfer } = boostEvent

      if (dataTransfer) {
        dataTransfer.effectAllowed = 'all'

        try {
          dataTransfer.setData('application/json', '{}')
        } catch (ex) {
          // ignore
        }
      }

      dragstart()
    } else {
      this.setNativeSelection(false)
    }

    handleEvents(doc => {
      /* istanbul ignore next */
      if (isBoostFromDragAPI) {
        doc.addEventListener('dragover', move, true)
        // dragexit
        didDrop = false
        doc.addEventListener('drop', drop, true)
        doc.addEventListener('dragend', over, true)
      } else {
        doc.addEventListener('mousemove', move, true)
        doc.addEventListener('mouseup', over, true)
      }
      doc.addEventListener('mousedown', over, true)
    })
  }

  private getMasterSensors() {
    return Array.from(
      new Set(
        this.designer.project.documents
          .map(doc => {
            if (doc.opened && doc.simulator?.sensorAvailable) {
              return doc.simulator
            }
            return null
          })
          .filter(Boolean) as Simulator[],
      ),
    )
  }

  private getSimulators() {
    return new Set(this.designer.project.documents.map(doc => doc.simulator))
  }

  // #region ======== drag and drop helpers ============
  private setNativeSelection(enableFlag: boolean) {
    setNativeSelection(enableFlag)
    this.getSimulators().forEach(sim => {
      // sim?.setNativeSelection(enableFlag)
    })
  }

  /**
   * 设置拖拽态
   */
  private setDraggingState(state: boolean) {
    cursor.setDragging(state)
    this.getSimulators().forEach(sim => {
      // sim?.setDraggingState(state)
    })
  }

  /**
   * 设置拷贝态
   */
  private setCopyState(state: boolean) {
    cursor.setCopy(state)
    this.getSimulators().forEach(sim => {
      // sim?.setCopyState(state)
    })
  }

  /**
   * 清除所有态：拖拽态、拷贝态
   */
  private clearState() {
    cursor.release()
    this.getSimulators().forEach(sim => {
      // sim?.clearState()
    })
  }
  // #endregion

  /**
   * 添加投放感应区
   */
  addSensor(sensor: any) {
    this.sensors.push(sensor)
  }

  /**
   * 移除投放感应
   */
  removeSensor(sensor: any) {
    const i = this.sensors.indexOf(sensor)
    if (i > -1) {
      this.sensors.splice(i, 1)
    }
  }

  onDragstart(func: (e: LocateEvent) => any) {
    this.emitter.on('dragstart', func)

    return () => {
      this.emitter.off('dragstart', func)
    }
  }

  onDrag(func: (e: LocateEvent) => any) {
    this.emitter.on('drag', func)

    return () => {
      this.emitter.off('drag', func)
    }
  }

  onDragend(func: (x: { dragObject: DragObject; copy: boolean }) => any) {
    this.emitter.on('dragend', func)

    return () => {
      this.emitter.off('dragend', func)
    }
  }
}

const makeEventsHandler = (boostEvent: MouseEvent | DragEvent, sensors: Simulator[]) => {
  const topDoc = window.document
  const sourceDoc = boostEvent.view?.document || topDoc

  const docs = new Set<globalThis.Document>()
  docs.add(topDoc)
  docs.add(sourceDoc)
  sensors.forEach(sim => {
    const sdoc = sim.contentDocument
    if (sdoc) {
      docs.add(sdoc)
    }
  })

  return (handle: (sdoc: globalThis.Document) => void) => {
    docs.forEach(doc => handle(doc))
  }
  // return (handle: (doc: globalThis.Document) => void) => {
  //   handle(sourceDoc)
  // }
}
