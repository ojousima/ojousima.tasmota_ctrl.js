class TemperatureTarget {
  private target: number;
  private hysteresisLow: number;
  private hysteresisHigh: number;
  constructor(target: number, hysteresis: number) {
    this.target = target;
    this.hysteresisLow = target - hysteresis;
    this.hysteresisHigh = target + hysteresis;
  }
  get targetTemp(): number {
    return this.target;
  }
  get lowTemp(): number {
    return this.hysteresisLow;
  }
  get highTemp(): number {
    return this.hysteresisHigh;
  }
}

export { TemperatureTarget };
