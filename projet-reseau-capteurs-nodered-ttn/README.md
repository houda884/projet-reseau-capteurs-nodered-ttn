# Réseau de capteurs environnementaux : Node-RED et TTN

Projet du cours **Communications et protocoles IoT** (filière SMART-ICT, INE3, INPT).
Il réalise le projet « Réseau de capteurs environnementaux avec Node-RED » en suivant les étapes d'une chaîne de type LoRaWAN, avec **The Things Network (TTN)** à la place d'une carte LoRa.

![Architecture du projet](docs/img/schema_ttn.png)

## Fonctionnement

1. Un **capteur virtuel** (Python) lit la météo de Paris sur l'API **OpenWeatherMap**.
2. Il encode la température et l'humidité au format **Cayenne LPP** (7 octets) et les envoie à **TTN** (appareil virtuel).
3. TTN décode le payload (formateur *CayenneLPP*) et le publie sur son serveur **MQTT**.
4. **Node-RED** lit ces messages, extrait les mesures et applique des **règles d'alerte**.
5. Un **dashboard** affiche les mesures en temps réel, avec des notifications et des seuils réglables.

> La simulation envoie le message directement au serveur applicatif de TTN : les passerelles et le serveur réseau de TTN ne sont pas traversés. La passerelle « test » visible dans les messages est fictive.

## Fonctionnalités du dashboard

- Jauges de température et d'humidité, historique, dernière trame (appareil, passerelle, RSSI, SNR).
- **Alertes** : notification rouge, état « ALERTE », dernière alerte, seuils actifs.
- **Seuils réglables** par curseurs (température : 0 à 40 °C, défaut 27 ; humidité : 50 à 100 %, défaut 90).
- Bouton **« Tester l'alerte »** pour la démonstration.

| Fonctionnement normal | Alerte de température (seuil 6 °C) |
|---|---|
| ![Dashboard](docs/img/dash_normal.png) | ![Alerte](docs/img/dash_alerte_temp.png) |

## Prérequis

- Python 3 et la bibliothèque `requests`
- [Node-RED](https://nodered.org/) avec le module `node-red-dashboard`
- Un compte [OpenWeatherMap](https://openweathermap.org/current) (clé d'API gratuite)
- Un compte TTN ([console](https://console.cloud.thethings.network/), cluster Europe 1) avec :
  - une application et un appareil (par exemple `capteur-paris`) ;
  - le **formateur de payload montant** réglé sur **CayenneLPP** ;
  - une **clé d'API** avec les droits de lire le trafic de l'application et d'écrire des uplinks.

## Installation

```bash
git clone https://github.com/<votre-compte>/projet-reseau-capteurs-nodered-ttn.git
cd projet-reseau-capteurs-nodered-ttn
python -m venv venv
# Windows : venv\Scripts\activate    Linux/Mac : source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

**Ne jamais publier de clé d'API.** Dans `scripts/end_device_ttn.py`, remplacez les valeurs `COLLE_...` par vos propres identifiants :

| Variable | Contenu |
|---|---|
| `APP_ID` | identifiant de l'application TTN |
| `DEVICE_ID` | identifiant de l'appareil TTN |
| `TTN_KEY` | clé d'API TTN |
| `OWM_KEY` | clé d'API OpenWeatherMap |

## Utilisation

1. Lancer Node-RED : `node-red`, puis ouvrir http://127.0.0.1:1880.
2. Menu **Importer** et sélectionner `flow/flow_ttn_alertes.json`.
3. Dans la configuration du serveur MQTT **TTN** : serveur `eu1.cloud.thethings.network`, port `8883` (TLS), nom d'utilisateur `<id-application>@ttn`, mot de passe = clé d'API TTN. Adapter le topic du nœud `mqtt in` : `v3/<id-application>@ttn/devices/+/up`. Puis **Déployer**.
4. Lancer le capteur : `python scripts/end_device_ttn.py`.
5. Ouvrir le dashboard : http://127.0.0.1:1880/ui (onglet **TTN**).

## Structure du dépôt

```
.
├── scripts/
│   ├── end_device_ttn.py     # capteur virtuel : API météo -> Cayenne LPP -> TTN
│   ├── decodage_ttn.js       # fonction Node-RED : extraction des mesures
│   └── regles_alerte.js      # fonction Node-RED : règles d'alerte
├── flow/
│   └── flow_ttn_alertes.json # flux Node-RED à importer
├── docs/
│   ├── Rapport_Projet_Reseau_capteurs_NodeRED_TTN.pdf
│   └── img/                  # schémas et captures
├── requirements.txt
└── README.md
```

## Limites et perspectives

- Liaison radio simulée (RSSI et SNR fixes) ; passerelles et serveur réseau de TTN non traversés.
- Perspectives : matériel LoRa réel avec activation OTAA, notifications par messagerie, historique à long terme, protection du dashboard.

## Auteur

Houda Bouya, filière SMART-ICT / INE3, INPT. Encadrant : Pr. Omar Ait Oulhaj.
