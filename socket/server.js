var SerialPort = require("serialport");
var xbee_api = require("xbee-api");
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

    if (frame.analogSamples.AD1 > poids) {
      exec(
        'mosquitto_pub -h test.mosquitto.org -t lettres/topic -m "Vous venez de recevoir un courrier"',
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
