import { DateTime } from "luxon";
import { temperatureSetTarget, switchSetState } from "../../mqtt";
import { temperatureTargetToInflux } from "../../influx";
import { TasmotaSwitchState } from "../../tasmota";
import { TemperatureProfile } from "./temperatureProfile";
import { TemperatureTarget } from "./temperatureTarget";
import { TemperatureMeasurement } from "./TemperatureMeasurement";

class TemperatureControl {
  private temperatureHysteresis: number;
  private profile: TemperatureProfile;
  private roomName: string;
  private _measurement: TemperatureMeasurement = new TemperatureMeasurement(
    0,
    0
  );
  private ctrlTimer;
  constructor(name: string) {
    this.temperatureHysteresis = 1.0;
    this.profile = new TemperatureProfile();
    this.roomName = name;
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
        temperatureTargetToInflux(target, this.roomName);
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
      throw new Error(
        "Room " + this.roomName + " does not have a valid measurement"
      );
    }
  }
}

interface ITempCtrl {
  [index: string]: TemperatureControl;
}

const ctrlRooms = {} as ITempCtrl;

const TemperatureControlInit = (): void => {
  // TODO: Parametrize room names
  ctrlRooms.Office = new TemperatureControl("Office");
  ctrlRooms.Kitchen = new TemperatureControl("Kitchen");
  ctrlRooms.Livingroom = new TemperatureControl("Livingroom");
  ctrlRooms.Bedroom = new TemperatureControl("Bedroom");
};

export { TemperatureControlInit };
