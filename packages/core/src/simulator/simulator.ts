export class Simulator {
  isSimulator = true

  private _sensorAvailable = true

  get sensorAvailable(): boolean {
    return this._sensorAvailable
  }
}

export function isSimulator(obj: any): obj is Simulator {
  return obj && obj.isSimulator
}
