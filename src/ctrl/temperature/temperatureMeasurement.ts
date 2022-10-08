import { DateTime } from "luxon";
import { hexStringToBytes } from "../../utils";
import {
  RuuviTagBroadcast,
  getParser,
  manufacturerDataParser,
} from "ojousima.ruuvi_endpoints.ts";

const isNumber = (val: any) => typeof val === "number" && val === val;

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

  parseRuuviMeasurement(blePayload: string): void {
    const payload = hexStringToBytes(
      blePayload.slice(blePayload.indexOf("FF9904") + 6)
    );
    const parser: manufacturerDataParser = getParser(payload);
    const parsedData = parser(payload);
    if (
      parsedData instanceof RuuviTagBroadcast &&
      null !== parsedData.temperatureC
    ) {
      this.measurementValue = parsedData.temperatureC;
      this.measurementTime = DateTime.now().toMillis();
    }
  }
}

export { TemperatureMeasurement };
