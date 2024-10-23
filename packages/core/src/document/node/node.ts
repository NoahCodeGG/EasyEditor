import { createLogger } from '@/utils'
import { observable } from 'mobx'

export interface NodeSchema {
  id: string
  props: any
  children?: NodeSchema[]
}

export class Node {
  private logger = createLogger('Node')

  @observable.ref id = ''
}
