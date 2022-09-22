import * as mqtt from "mqtt";
import { BROKER } from "../env";
import { TasmotaStateToInflux, TasmotaSensorToInflux } from "./influx";
import { TasmotaState, TasmotaSensor, TasmotaSwitchState } from "./tasmota";

const opts: mqtt.IClientOptions = {};

const client: mqtt.Client = mqtt.connect(`mqtt://${BROKER}`, opts);

const tasmotaTimeToSecs = (tasmotaTime: string) => {
  // "0T00:00:03"
  const days = parseInt(
    tasmotaTime.substring(0, tasmotaTime.lastIndexOf("T")),
    10
  );
  const hours = parseInt(
    tasmotaTime.substring(
      tasmotaTime.lastIndexOf("T") + 1,
      tasmotaTime.indexOf(":")
    ),
    10
  );
  const minutes = parseInt(
    tasmotaTime.substring(
      tasmotaTime.indexOf(":") + 1,
      tasmotaTime.lastIndexOf(":")
    ),
    10
  );
  const seconds = parseInt(
    tasmotaTime.substring(tasmotaTime.lastIndexOf(":") + 1),
    10
  );
  return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
};

const handleSensorMessage = (topic: string, message: Buffer) => {
  // console.log("Got Sensor Message:");
  // console.log(message.toString())
  // Format data into object
  const data = JSON.parse(message.toString());
  const id = topic.substring(
    topic.lastIndexOf("/tasmota_") + "/tasmota_".length,
    topic.lastIndexOf("/SENSOR")
  );
  const stateObj = new TasmotaSensor(
    id,
    "AA:BB:CC:DD:EE:FF",
    new Date(),
    data.ENERGY.Total,
    data.ENERGY.Today,
    data.ENERGY.Yesterday,
    data.ENERGY.Power,
    data.ENERGY.ApparentPower,
    data.ENERGY.ReactivePower,
    data.ENERGY.Factor,
    data.ENERGY.Voltage,
    data.ENERGY.Current
  );
  // console.log("Tasomta object:");
  // console.log(JSON.stringify(stateObj));
  // Call InfluxDB to store the object.
  TasmotaSensorToInflux(stateObj);
};
const handleStateMessage = (topic: string, message: Buffer) => {
  // console.log("Got State Message: " + topic);
  // console.log(message.toString())
  // Format data into object
  const data = JSON.parse(message.toString());
  const id = topic.substring(
    topic.lastIndexOf("/tasmota_") + "/tasmota_".length,
    topic.lastIndexOf("/STATE")
  );
  const stateObj = new TasmotaState(
    id,
    "AA:BB:CC:DD:EE:FF",
    new Date(),
    data.UptimeSec,
    data.Heap,
    data.SleepMode,
    data.Sleep,
    data.LoadAvg,
    data.POWER,
    data.MqttCount,
    data.Wifi.RSSI,
    tasmotaTimeToSecs(data.Wifi.Downtime)
  );
  // console.log("Tasomta object:");
  // console.log(JSON.stringify(stateObj));
  // Call InfluxDB to store the object.
  TasmotaStateToInflux(stateObj);
};

const handleMeasurementMessage = (topic: string, message: Buffer) => {
  const data = JSON.parse(message.toString());
  const id = topic.substring(
    topic.lastIndexOf("building_apt/") + "building_apt/".length,
    topic.lastIndexOf("/temp/current")
  );
};

const mqttInit = () => {
  client.on("connect", () => {
    // TODO: Parametrize mac addresses.
    client.subscribe("ruuvi/D4:58:E3:F8:68:11/#", (err) => {
      if (!err) {
        console.log("MQTT Sub to GW ok");
      } else {
        console.error(err, "MQTT problem");
      }
    });
    client.subscribe("tele/#", (err) => {
      if (!err) {
        console.log("MQTT Sub to Tasmota ok");
      } else {
        console.error(err, "MQTT problem");
      }
    });
  });

  client.on("message", (topic, message) => {
    // message is Buffer
    // console.log(message.toString());
    try {
      // Topic contains "/STATE"
      const stateIdx = topic.lastIndexOf("/STATE");
      if (stateIdx > 0) {
        handleStateMessage(topic, message);
      }
      const sensorsIdx = topic.lastIndexOf("/SENSOR");
      if (sensorsIdx > 0) {
        handleSensorMessage(topic, message);
      }
      const tempCurrentIdx = topic.lastIndexOf("/ruuvi");
      if (tempCurrentIdx > 0) {
        handleMeasurementMessage(topic, message);
      }
    } catch (e) {
      console.log(JSON.stringify(e));
      console.log(topic, +":\n" + message.toString());
      return;
    }
  });
};

const switchSetState = (switchId: string, state: TasmotaSwitchState) => {
  const topic: string = "cmnd/tasmota_" + switchId + "/Power";
  switch (state) {
    case TasmotaSwitchState.On:
      client.publish(topic, "ON");
      break;

    case TasmotaSwitchState.Off:
      client.publish(topic, "OFF");
      break;

    default:
      break;
  }
};

const temperatureSetTarget = (roomId: string, target: number) => {
  // Todo: Parametrize building/apt topic
  const topic: string = "building_apt/" + roomId + "/temp/target";
  client.publish(topic, target.toString());
};

const temperatureSetCurrent = (roomId: string, current: number) => {
  // Todo: Parametrize building/apt topic
  const topic: string = "building_apt/" + roomId + "/temp/current";
  client.publish(topic, current.toString());
};

export {
  mqttInit,
  switchSetState,
  temperatureSetCurrent,
  temperatureSetTarget,
};
