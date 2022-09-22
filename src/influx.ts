import { InfluxDB, FieldType, toNanoDate } from "influx";
import {
  BROKER,
  INFLUX_HOST,
  INFLUX_USER,
  INFLUX_PORT,
  INFLUX_PASSWORD,
  TASMOTA_DB,
} from "../env";

import { TasmotaState, TasmotaSensor } from "./tasmota";

import { TemperatureTarget } from "./ctrl/temperature/temperatureTarget";

const tasmotaStateMeasurementName = "TasmotaState";
const tasmotaSensorMeasurementName = "TasmotaSensor";
const temperatureTargetMeasurementName = "TemperatureTarget";

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

const tasmotaSensorSchema = [
  {
    measurement: tasmotaSensorMeasurementName,
    fields: {
      total: FieldType.FLOAT,
      today: FieldType.FLOAT,
      apparentPower: FieldType.FLOAT,
      reactivePower: FieldType.FLOAT,
      activePower: FieldType.FLOAT,
      factor: FieldType.FLOAT,
      voltage: FieldType.FLOAT,
      current: FieldType.FLOAT,
    },
    tags: ["mac", "id"],
  },
];

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

const tasmotaStateSchema = [
  {
    measurement: tasmotaStateMeasurementName,
    fields: {
      rssi: FieldType.INTEGER,
      uptime: FieldType.INTEGER,
      heap: FieldType.INTEGER,
      sleepMode: FieldType.STRING,
      sleep: FieldType.INTEGER,
      loadAvg: FieldType.INTEGER,
      mqttCount: FieldType.INTEGER,
      txPower: FieldType.INTEGER,
      power: FieldType.STRING,
      powerNumber: FieldType.INTEGER,
      wifiDowntime: FieldType.INTEGER,
    },
    tags: ["mac", "id"],
  },
];

const temperatureTargetSchema = [
  {
    measurement: temperatureTargetMeasurementName,
    fields: {
      target: FieldType.FLOAT,
      hysteresis_low: FieldType.FLOAT,
      hysteresis_high: FieldType.FLOAT,
    },
    tags: ["name"],
  },
];

const tasmotaStateInflux = new InfluxDB({
  host: INFLUX_HOST,
  database: TASMOTA_DB,
  schema: tasmotaStateSchema,
  username: INFLUX_USER,
  password: INFLUX_PASSWORD,
});

const tasmotaSensorInflux = new InfluxDB({
  host: INFLUX_HOST,
  database: TASMOTA_DB,
  schema: tasmotaSensorSchema,
  username: INFLUX_USER,
  password: INFLUX_PASSWORD,
});

const temperatureTargetInflux = new InfluxDB({
  host: INFLUX_HOST,
  database: TASMOTA_DB,
  schema: temperatureTargetSchema,
  username: INFLUX_USER,
  password: INFLUX_PASSWORD,
});

const TasmotaStateToInflux = (data: TasmotaState): void => {
  // console.log(JSON.stringify(data));
  const influxSamples = [];

  const powerNumber = data.power === "ON" ? 1 : 0;
  const dateNanos = new Date(data.parsedAt).getTime() * 1000 * 1000;
  const dateNanoString = dateNanos.toString();

  const tasmotaPoint = {
    fields: {
      rssi: data.wifiRssi,
      uptime: data.uptimeSec,
      heap: data.heap,
      sleepMode: data.sleepMode,
      sleep: data.sleep,
      loadAvg: data.loadAvg,
      mqttCount: data.mqttCount,
      power: data.power,
      powerNumber,
      wifiDowntime: data.wifiDowntime,
    },
    tags: {
      mac: data.mac,
      id: data.id,
    },
    timestamp: toNanoDate(dateNanoString),
    measurement: tasmotaStateMeasurementName,
  };
  influxSamples.push(tasmotaPoint);
  try {
    tasmotaStateInflux.writePoints(influxSamples);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
  }
};

const TasmotaSensorToInflux = (data: TasmotaSensor): void => {
  const influxSamples = [];

  const dateNanos = new Date(data.parsedAt).getTime() * 1000 * 1000;
  const dateNanoString = dateNanos.toString();

  const tasmotaPoint = {
    fields: {
      total: data.total,
      today: data.today,
      apparentPower: data.apparentPower,
      reactivePower: data.reactivePower,
      activePower: data.power,
      factor: data.factor,
      voltage: data.voltage,
      current: data.current,
    },
    tags: {
      mac: data.mac,
      id: data.id,
    },
    timestamp: toNanoDate(dateNanoString),
    measurement: tasmotaSensorMeasurementName,
  };
  influxSamples.push(tasmotaPoint);
  try {
    tasmotaSensorInflux.writePoints(influxSamples);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
  }
};

const temperatureTargetToInflux = (
  target: TemperatureTarget,
  name: string
): void => {
  const influxSamples = [];

  const dateNanos = new Date().getTime() * 1000 * 1000;
  const dateNanoString = dateNanos.toString();

  const temperaturePoint = {
    fields: {
      target: target.targetTemp,
      hysteresis_low: target.lowTemp,
      hysteresis_high: target.highTemp,
    },
    tags: {
      name,
    },
    timestamp: toNanoDate(dateNanoString),
    measurement: temperatureTargetMeasurementName,
  };
  influxSamples.push(temperaturePoint);
  try {
    temperatureTargetInflux.writePoints(influxSamples);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
  }
};

export {
  TasmotaStateToInflux,
  TasmotaSensorToInflux,
  temperatureTargetToInflux,
};
