import { DateTime } from "luxon";

class TemperatureMeasurement {
  private measurementValue: number;
  private measurementTime: number;
  constructor(measurement: number, time: number) {
    this.measurementValue = measurement;
    this.measurementTime = time;
  }
  get temperature(): number {
    return this.measurementValue;
  }
  get time(): number {
    return this.measurementTime;
  }
  // Measurement older than 60 minutes in not considered valid.
  get isValid(): boolean {
    return DateTime.now().toMillis() - this.measurementTime < 1000 * 60 * 60;
  }
}
export { TemperatureMeasurement };
