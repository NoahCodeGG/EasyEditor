export class Simulator {
  isSimulator = true
}

export function isSimulator(obj: any): obj is Simulator {
  return obj && obj.isSimulator
}
