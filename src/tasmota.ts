/* 
Tasmota device state JSON
{
  "Time":"2022-08-13T18:52:16",
  "Uptime":"0T02:05:09",
  "UptimeSec":7509,
  "Heap":25,
  "SleepMode":"Dynamic",
  "Sleep":50,
  "LoadAvg":19,
  "MqttCount":1,
  "POWER":"ON",
  "Wifi": {
    "AP":1,
    "SSId":"Telia-971632",
    "BSSId":"34:E3:80:97:16:34",
    "Channel":1,
    "Mode":"11n",
    "RSSI":76,
    "Signal":-62,
    "LinkCount":1,
    "Downtime":"0T00:00:03"
  }
}
*/

class TasmotaState {
  public readonly id: string;
  public readonly mac: string | null;
  public readonly parsedAt: Date;
  public readonly uptimeSec: number;
  public readonly heap: number;
  public readonly sleepMode: string;
  public readonly sleep: number;  
  public readonly loadAvg: number;
  public readonly power: string;
  public readonly mqttCount: number;
  public readonly wifiRssi: number;
  public wifiDowntime: number;

  public constructor(
    id: string,
    mac: string | null,
    parsedAt: Date,
    uptimeSec: number,
    heap: number,
    sleepMode: string,
    sleep: number,
    loadAvg: number,
    power: string,
    mqttCount: number,
    wifiRssi: number,
    wifiDowntime: number
  ) {
    this.id = id;
    this.mac = mac;
    this.parsedAt = parsedAt;
    this.uptimeSec = uptimeSec;
    this.heap = heap;
    this.sleepMode = sleepMode;
    this.sleep = sleep;
    this.loadAvg = loadAvg;
    this.power = power;
    this.mqttCount = mqttCount;
    this.wifiRssi = wifiRssi;
    this.wifiDowntime = wifiDowntime;
  }
}
/*
Tasmota Sensor JSON:
{
  "sn":
  {
    "Time":"2022-08-13T16:47:21",
    "ENERGY":
    {
      "TotalStartTime":"2022-08-13T16:40:18",
      "Total":0.000,
      "Yesterday":0.000,
      "Today":0.000,
      "Power": 0,
      "ApparentPower": 0,
      "ReactivePower": 0,
      "Factor":0.00,
      "Voltage":271,
      "Current":0.000
    }
  },
  "ver":1
}
*/

class TasmotaSensor {
  public readonly id: string;
  public readonly mac: string | null;
  public readonly parsedAt: Date;
  public readonly total: number;
  public readonly today: number;
  public readonly yesterday: number;  
  public readonly power: number;
  public readonly apparentPower: string;
  public readonly reactivePower: number;
  public readonly factor: number;
  public readonly voltage: number;
  public readonly current: number;

  public constructor(
    id: string,
    mac: string | null,
    parsedAt: Date,
    total: number,
    today: number,
    yesterday: number,
    power: number,
    apparentPower: string,
    reactivePower: number,
    factor: number,
    voltage: number,
    current: number
  ) {
    this.id = id;
    this.mac = mac;
    this.parsedAt = parsedAt;
    this.total = total;
    this.today = today;
    this.yesterday = yesterday;
    this.power = power;
    this.apparentPower = apparentPower;
    this.reactivePower = reactivePower;
    this.factor = factor;
    this.voltage = voltage;
    this.current = current;
  }
}

enum TasmotaSwitchState {
  Off = 0,
  On = 1
}

export {
  TasmotaState,
  TasmotaSensor,
  TasmotaSwitchState
}