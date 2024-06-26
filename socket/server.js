var SerialPort = require("serialport");
var xbee_api = require("xbee-api");
var mqtt = require("mqtt");
var C = xbee_api.constants;
require("dotenv").config();
const { exec } = require("child_process");

const SERIAL_PORT = process.env.SERIAL_PORT;
var poids = 0;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2,
});

let serialport = new SerialPort(
  SERIAL_PORT,
  {
    baudRate: parseInt(process.env.SERIAL_BAUDRATE) || 9600,
  },
  function (err) {
    if (err) {
      return console.log("Error: ", err.message);
    }
  }
);

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

serialport.on("open", function () {
  var frame_obj = {
    // AT Request to be sent
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
  };

  xbeeAPI.builder.write(frame_obj);

  frame_obj = {
    // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "NI",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);
});

// Function to set pin D2 to 5
function setPinD2To(value) {
  var frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "0013A20041FB6063", // Replace with your destination address
    command: "D2",
    commandParameter: [value], // Value for the pin D2
  };
  xbeeAPI.builder.write(frame_obj);
}

// MQTT Client setup
const mqttClient = mqtt.connect("wss://test.mosquitto.org:8081");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("lettres/topic", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      console.log("Subscribed to topic: lettres");
    }
  });
});

mqttClient.on("message", (topic, message) => {
  const msg = message.toString();
  const timestamp = new Date().toLocaleString();
  console.log("Received message:", msg);




  if (msg === "u-fermer") {
    var frame_obj = {
      type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
      destination64: "0013A20041FB6063", // Replace with your destination address
      command: "D2",
      commandParameter: [0x04], // Value for the pin D2
    };
    xbeeAPI.builder.write(frame_obj);// Value for closing
  } else if (msg === "u-ouvrir") {
    var frame_obj = {
      type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
      destination64: "0013A20041FB6063", // Replace with your destination address
      command: "D2",
      commandParameter: [0x05], // Value for the pin D2
    };
    xbeeAPI.builder.write(frame_obj);// Value for closing
  }
});

// All frames parsed by the XBee will be emitted here
xbeeAPI.parser.on("data", function (frame) {
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);
    console.log(">> Raw Data:", frame.data);
  }

  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    console.log("NODE_IDENTIFICATION");
    console.log(">> Node Identifier:", frame.nodeIdentifier);
    console.log(">> Remote 64-bit address:", frame.remote64);
  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {
    console.log("ZIGBEE_IO_DATA_SAMPLE_RX");
    console.log(">> Analog Sample AD0:", frame.analogSamples.AD1);
    console.log(">> Raw Frame Data:", frame);
    
    if (frame.analogSamples.AD1 > poids+5) {
      exec(
        'mosquitto_pub -h test.mosquitto.org -t lettres/topic -m "Reception du courrier"',
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              `Erreur lors de l'exécution de la commande: ${error.message}`
            );
            return;
          }
          if (stderr) {
            console.error(`Erreur de sortie de la commande: ${stderr}`);
            return;
          }
          console.log(`Commande exécutée avec succès: ${stdout}`);
        }
      );
      setPinD2To(0x04);
      poids = frame.analogSamples.AD1;
    }
  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    
    console.log("REMOTE_COMMAND_RESPONSE");
    console.log(">> Command Data:", frame.commandData);
  } else {
    console.debug(frame);
    if (frame.commandData) {
      let dataReceived = String.fromCharCode.apply(null, frame.commandData);
      console.log(">> Other Frame Data:", dataReceived);
    } else {
      console.log(">> Frame:", frame);
    }
  }
});
