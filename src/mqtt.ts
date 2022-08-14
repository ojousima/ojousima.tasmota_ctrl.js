import * as mqtt from 'mqtt';
import { BROKER } from '../env';
import { TasmotaStateToInflux, TasmotaSensorToInflux } from './influx'
import { TasmotaState, TasmotaSensor } from './tasmota'

const opts: mqtt.IClientOptions = {};

const client: mqtt.Client = mqtt.connect(`mqtt://${BROKER}`, opts);

const tasmotaTimeToSecs = function(tasmotaTime:String)
{
  // "0T00:00:03"
  const days = parseInt(tasmotaTime.substring(0, tasmotaTime.lastIndexOf('T')));
  const hours = parseInt(tasmotaTime.substring(tasmotaTime.lastIndexOf('T') + 1, tasmotaTime.indexOf(':')));
  const minutes = parseInt(tasmotaTime.substring(tasmotaTime.indexOf(':') + 1, tasmotaTime.lastIndexOf(':')));
  const seconds = parseInt(tasmotaTime.substring(tasmotaTime.lastIndexOf(':') + 1));
  return days * 24 * 60 * 60
         + hours * 60 * 60
         + minutes * 60
         + seconds;
};

const handleSensorMessage = function(topic:String, message:Buffer) {
  //console.log("Got Sensor Message:");
  //console.log(message.toString())
  // Format data into object
  const data = JSON.parse(message.toString());
  const id = topic.substring(topic.lastIndexOf('/tasmota_') + '/tasmota_'.length, topic.lastIndexOf('/SENSOR'));
  const stateObj = new TasmotaSensor (
      id,
      null,
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
  //console.log("Tasomta object:");
  //console.log(JSON.stringify(stateObj));
  // Call InfluxDB to store the object.
  TasmotaSensorToInflux(stateObj);

}
const handleStateMessage = function(topic:String, message:Buffer) {
  //console.log("Got State Message: " + topic);
  //console.log(message.toString())
  // Format data into object
  const data = JSON.parse(message.toString());
  const id = topic.substring(topic.lastIndexOf('/tasmota_') + '/tasmota_'.length, topic.lastIndexOf('/STATE'));
  const stateObj = new TasmotaState (
      id,
      null,
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
  //console.log("Tasomta object:");
  //console.log(JSON.stringify(stateObj));
  // Call InfluxDB to store the object.
  TasmotaStateToInflux(stateObj);

}

const mqttInit = function (): void {
  client.on('connect', function () {
    client.subscribe('#', function (err) {
      if (!err) {
        console.log('MQTT Sub ok');
      } else {
        console.error(err, 'MQTT problem');
      }
    });
  });

  client.on('message', function (topic, message) {
    // message is Buffer
    // console.log(message.toString());

    // Topic contains "sensors"
    const state_idx = topic.lastIndexOf('/STATE');
    if(state_idx > 0)
    {
      handleStateMessage(topic, message);
    }
    const sensors_idx = topic.lastIndexOf('/SENSOR');
    if(sensors_idx > 0)
    {
      handleSensorMessage(topic, message);
    }
  });
};

export {
  mqttInit
};