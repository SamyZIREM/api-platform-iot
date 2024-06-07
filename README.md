# Projet IoT : Boîte aux Lettres Connectée

## M1 ILMSI 2023 - 2024

### Réalisé par :
- Ahmed OUDRHIRI
- Anass OUHAMMI
- Samy ZIREM
- Ghita AJOUBAIR

### Encadré par :
- Sébastien FLEURY

## Introduction
Ce projet vise à développer une boîte aux lettres connectée capable d'envoyer une notification lorsqu'une lettre ou un colis est déposé et capable d'ouvrir et de fermer la porte à distance via l'appli.

## Communications MQTT
Le serveur Node.js (server.js) qui est dans le dossier "socket" et l'application React (dossier "frontend") communiquent avec le broker MQTT test.mosquitto.org via les topics “lettres/topic”.
