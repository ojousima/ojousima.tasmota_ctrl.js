const { DateTime } = require("luxon");
import { temperatureSetTarget } from "../../mqtt";
import { temperatureTargetToInflux } from "../../influx";

class TemperatureProfile {
  private target: number[];

  constructor() {
    // TODO: Read per room / hour from JSON or smth
    this.target = [];
    this.target[0] = 18;
    this.target[1] = 18;
    this.target[2] = 18;
    this.target[3] = 18;
    this.target[4] = 18;
    this.target[5] = 18;
    this.target[6] = 18;
    this.target[7] = 15;
    this.target[8] = 15;
    this.target[9] = 15;
    this.target[10] = 15;
    this.target[11] = 15;
    this.target[12] = 15;
    this.target[13] = 15;
    this.target[14] = 15;
    this.target[15] = 15;
    this.target[16] = 18;
    this.target[17] = 18;
    this.target[18] = 18;
    this.target[19] = 18;
    this.target[20] = 18;
    this.target[21] = 18;
    this.target[22] = 18;
    this.target[23] = 18;
  }

  get targetNow(): number {
    return this.target[DateTime.now().hour];
  }
}

class TemperatureControl {
  private temperatureHysteresis: number;
  private profile: TemperatureProfile;
  private roomName: string;
  private ctrlTimer;
  constructor(name: string) {
    this.temperatureHysteresis = 1.0;
    this.profile = new TemperatureProfile();
    this.roomName = name;
    this.ctrlTimer = setInterval(
      function (ctrl: TemperatureControl) {
        const target = new TemperatureTarget(
          ctrl.profile.targetNow,
          ctrl.temperatureHysteresis
        );
        ctrl.printTarget(target);
        temperatureTargetToInflux(target, ctrl.roomName);
      },
      60000,
      this
    );
  }
  printTarget(target: TemperatureTarget): void {
    console.log(
      "Heating up " + this.roomName + " to " + target.targetTemp + " degrees"
    );
  }
}

class TemperatureTarget {
  private target: number;
  private hysteresis_low: number;
  private hysteresis_high: number;
  constructor(target: number, hysteresis: number) {
    this.target = target;
    this.hysteresis_low = target - hysteresis;
    this.hysteresis_high = target + hysteresis;
  }
  get targetTemp(): number {
    return this.target;
  }
  get lowTemp(): number {
    return this.hysteresis_low;
  }
  get highTemp(): number {
    return this.hysteresis_high;
  }
}

const ctrlOffice = new TemperatureControl("Office");
const ctrlKitchen = new TemperatureControl("Kitchen");
const ctrlLiving = new TemperatureControl("Livingroom");
const ctrlBedroom = new TemperatureControl("Bedroom");

export { TemperatureTarget };
