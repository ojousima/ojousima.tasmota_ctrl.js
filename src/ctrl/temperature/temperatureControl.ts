import { DateTime } from "luxon";
import { temperatureSetTarget, switchSetState } from "../../mqtt";
import { temperatureTargetToInflux } from "../../influx";
import { TasmotaSwitchState } from "../../tasmota";
import { TemperatureProfile } from "./temperatureProfile";
import { TemperatureTarget } from "./temperatureTarget";
import { TemperatureMeasurement } from "./temperatureMeasurement";

class TemperatureControl {
  private temperatureHysteresis: number;
  private profile: TemperatureProfile;
  public readonly roomName: string;
  public readonly sensorMac: number; //Using numberic representation of MAC for MAC->room lookups
  private _measurement: TemperatureMeasurement = new TemperatureMeasurement(
    0,
    0
  );
  private ctrlTimer;
  constructor(name: string, mac: number) {
    this.temperatureHysteresis = 1.0;
    this.profile = new TemperatureProfile();
    this.roomName = name;
    this.sensorMac = mac;
    this.ctrlTimer = setInterval(() => {
      const target = new TemperatureTarget(
        this.profile.targetNow,
        this.temperatureHysteresis
      );
      let action: TasmotaSwitchState = TasmotaSwitchState.Off;
      try {
        if (!this._measurement.isValid) {
          action = TasmotaSwitchState.Off;
        } else if (this.measurement < target.lowTemp) {
          action = TasmotaSwitchState.On;
        } else if (this.measurement > target.highTemp) {
          action = TasmotaSwitchState.Off;
        } else {
          action = TasmotaSwitchState.Hold;
        }

        this.printAction(target, this.measurement, action);
        temperatureTargetToInflux(this, target);
      } catch (e) {
        console.log(JSON.stringify(e));
      }
      switchSetState(this.roomName, action);
    }, 60000);
  }
  printAction(
    target: TemperatureTarget,
    measurement: number,
    action: TasmotaSwitchState
  ): void {
    console.log(
      this.roomName +
        " is at " +
        measurement.toFixed(1) +
        " degrees, target is " +
        target.targetTemp.toFixed(1) +
        " degrees. Action: " +
        action
    );
  }
  get measurement() {
    if (this._measurement.isValid) {
      return this._measurement.temperature;
    } else {
      return NaN;
    }
  }
  setMeasurement(data: string) {
    this._measurement.parseRuuviMeasurement(data);
  }
}

const ctrlRooms: TemperatureControl[] = [];

const TemperatureControlInit = (): void => {
  ctrlRooms[0] = new TemperatureControl("Office", 0xf240fd0ce347);
  ctrlRooms[1] = new TemperatureControl("Kitchen", 0x0);
  ctrlRooms[2] = new TemperatureControl("Livingroom", 0xc64b56ac5b05);
  ctrlRooms[3] = new TemperatureControl("Bedroom", 0xd8ba7cc74a83);
};

const handleMeasurementMessage = (topic: string, data: Buffer): void => {
  // Find room with associated MAC address
  // ruuvi/D4:58:E3:F8:68:11/F7:1F:CD:E9:07:E9
  let mac = topic.substring(topic.lastIndexOf("/") + 1);
  mac = mac.replaceAll(":", "");
  const id = parseInt(mac, 16);
  for (let ii = 0; ii < ctrlRooms.length; ii++) {
    if (ctrlRooms[ii].sensorMac === id) {
      ctrlRooms[ii].setMeasurement(data.toString());
      break;
    }
  }
};

export { TemperatureControlInit, TemperatureControl, handleMeasurementMessage };
