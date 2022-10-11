import { DateTime } from "luxon";

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
    const local = DateTime.local();
    const rezoned = local.setZone("Europe/Tallinn");
    return this.target[rezoned.hour];
  }
}

export { TemperatureProfile };
