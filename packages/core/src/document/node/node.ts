import { createLogger } from '@/utils'

export interface NodeSchema {
  id: string
  props: any
  children?: NodeSchema[]
}

export class Node {
  private logger = createLogger('Node')
}
