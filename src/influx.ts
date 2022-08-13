const Influx = require('influx');
import {
  BROKER,
  INFLUX_HOST,
  INFLUX_USER,
  INFLUX_PORT,
  INFLUX_PASSWORD,
  TASMOTA_DB
} from '../env';

import {
  TasmotaState, TasmotaSensor
} from './tasmota';

const tasmotaStateMeasurementName  = 'TasmotaState';
const tasmotaSensorMeasurementName = 'TasmotaSensor';

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
      total: Influx.FieldType.FLOAT,
      today: Influx.FieldType.FLOAT,
      apparentPower: Influx.FieldType.FLOAT,
      reactivePower: Influx.FieldType.FLOAT,
      activePower: Influx.FieldType.FLOAT,
      factor: Influx.FieldType.FLOAT,
      voltage: Influx.FieldType.FLOAT,
      current: Influx.FieldType.FLOAT,
    },
    tags: ['mac', 'id']
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
      rssi: Influx.FieldType.INTEGER,
      uptime: Influx.FieldType.INTEGER,
      heap: Influx.FieldType.INTEGER,
      sleepMode: Influx.FieldType.STRING,
      sleep: Influx.FieldType.INTEGER,
      loadAvg: Influx.FieldType.INTEGER,
      mqttCount: Influx.FieldType.INTEGER,
      txPower: Influx.FieldType.INTEGER,
      power: Influx.FieldType.STRING,
      powerNumber: Influx.FieldType.INTEGER,
      wifiDowntime: Influx.FieldType.INTEGER,
    },
    tags: ['mac', 'id']
  },
];

const tasmotaStateInflux = new Influx.InfluxDB({
  host: INFLUX_HOST,
  database: TASMOTA_DB,
  schema: tasmotaStateSchema,
  username: INFLUX_USER,
  password: INFLUX_PASSWORD,
});

const tasmotaSensorInflux = new Influx.InfluxDB({
  host: INFLUX_HOST,
  database: TASMOTA_DB,
  schema: tasmotaSensorSchema,
  username: INFLUX_USER,
  password: INFLUX_PASSWORD,
});

const TasmotaStateToInflux = function (data: TasmotaState): void {
  // console.log(JSON.stringify(data));
  const influx_samples = [];

  const powerNumber = data.power === "ON" ? 1 : 0
  const dateNanos = new Date(data.parsedAt).getTime() * 1000 * 1000;
  const dateNanoString = dateNanos.toString();
  
  const tasmota_point = {
    fields: {
      rssi: data.wifiRssi,
      uptime: data.uptimeSec,
      heap: data.heap,
      sleepMode: data.sleepMode,
      sleep: data.sleep,
      loadAvg: data.loadAvg,
      mqttCount: data.mqttCount,
      power: data.power,
      powerNumber: powerNumber,
      wifiDowntime: data.wifiDowntime
    },
    tags: {
      mac: data.mac,
      id: data.id,
    },
    timestamp: Influx.toNanoDate(dateNanoString),
    measurement: tasmotaStateMeasurementName,
  };
  influx_samples.push(tasmota_point);
  try {
    tasmotaStateInflux.writePoints(influx_samples);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
  }
};

const TasmotaSensorToInflux = function (data: TasmotaSensor): void {
  // console.log(JSON.stringify(data));
  const influx_samples = [];

  const dateNanos = new Date(data.parsedAt).getTime() * 1000 * 1000;
  const dateNanoString = dateNanos.toString();
  
  const tasmota_point = {
    fields: {
      total: data.total,
      today: data.today,
      apparentPower: data.apparentPower,
      reactivePower: data.reactivePower,
      activePower: data.power,
      factor: data.factor,
      voltage: data.voltage,
      current: data.current
    },
    tags: {
      mac: data.mac,
      id: data.id,
    },
    timestamp: Influx.toNanoDate(dateNanoString),
    measurement: tasmotaSensorMeasurementName,
  };
  influx_samples.push(tasmota_point);
  try {
    tasmotaSensorInflux.writePoints(influx_samples);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
  }
};

export {
  TasmotaStateToInflux,
  TasmotaSensorToInflux
}