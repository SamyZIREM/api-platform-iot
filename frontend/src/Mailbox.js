import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import "./Mailbox.css";

const Mailbox = () => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    console.log("Connecting to broker...");
    const mqttClient = mqtt.connect("ws://test.mosquitto.org:8081/mqtt");

    mqttClient.on("connect", () => {
      console.log("Connected to broker");
      mqttClient.subscribe("test/topic", (err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log("Subscribed to topic: test/topic");
        }
      });
    });

    mqttClient.on("error", (error) => {
      console.error("Connection error:", error);
    });

    mqttClient.on("message", (topic, message) => {
      const msg = message.toString();
      console.log("Received message:", msg);
      setReceivedMessages((prev) => [...prev, msg]);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const handlePublish = () => {
    if (client) {
      client.publish("test/topic", message);
      setMessage("");
    }
  };

  const handleClearMessages = () => {
    setReceivedMessages([]);
  };

  return (
    <div className="mailbox-container">
      <h1>Boîte aux Lettres Connectée</h1>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Entrez un message"
        />
        <button onClick={handlePublish}>Envoyer</button>
        <button onClick={handleClearMessages}>Effacer les messages</button>
      </div>
      <h2>Messages Reçus</h2>
      <ul className="message-list">
        {receivedMessages.map((msg, index) => (
          <li key={index} className="message-item">
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Mailbox;
