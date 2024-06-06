// src/Mailbox.js
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
      mqttClient.subscribe("lettres/topic", (err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log("Subscribed to topic: lettres/topic");
        }
      });
    });

    mqttClient.on("error", (error) => {
      console.error("Connection error:", error);
    });

    mqttClient.on("message", (topic, message) => {
      const msg = message.toString();
      const timestamp = new Date().toLocaleString();
      console.log("Received message:", msg);
      setReceivedMessages((prev) => [...prev, { msg, timestamp }]);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const handlePublish = () => {
    if (client) {
      client.publish("lettres/topic", message);
      setMessage("");
    }
  };

  const handleClearMessages = () => {
    setReceivedMessages([]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Boîte aux lettres Connectée</h1>
      </header>
      <main className="mailbox-container">
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
        <h2>Notifications messages (courriers) Reçus</h2>
        <ul className="message-list">
          {receivedMessages.map(({ msg, timestamp }, index) => (
            <li key={index} className="message-item">
              <strong>Courrier reçu :</strong> {msg}
              <div className="timestamp">{timestamp}</div>
            </li>
          ))}
        </ul>
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 Boîte aux lettres Connectée</p>
      </footer>
    </div>
  );
};

export default Mailbox;
