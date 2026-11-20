import base64, struct, time
from datetime import datetime, timezone
import requests

# --- Paramètres TTN (The Things Stack, cluster Europe 1) ---
TTN_BASE = "https://eu1.cloud.thethings.network/api/v3"
APP_ID = "COLLE_TON_APPLICATION_ID"     # ex. station-meteo-bouya
DEVICE_ID = "capteur-paris"             # ID de l'appareil virtuel
TTN_KEY = "COLLE_TA_CLE_TTN_ICI"        # clé d'API TTN (secrète, ne pas publier)
FPORT = 15

# --- Paramètres OpenWeatherMap ---
CITY = "Paris"
OWM_KEY = "COLLE_TA_CLE_OWM_ICI"        # clé OpenWeatherMap (secrète, ne pas publier)
OWM_URL = "https://api.openweathermap.org/data/2.5/weather"

PERIOD = 30                             # secondes entre deux envois

# --- Encodage Cayenne LPP ---
def cayenne_temperature(channel, celsius):
    return struct.pack(">BBh", channel, 0x67, int(round(celsius * 10)))

def cayenne_humidity(channel, percent):
    return struct.pack(">BBB", channel, 0x68, int(round(percent * 2)))

# --- Lecture de l'API météo ---
def lire_meteo():
    r = requests.get(OWM_URL, params={"q": CITY, "units": "metric", "appid": OWM_KEY}, timeout=10)
    if r.status_code == 401:
        raise RuntimeError("clé OpenWeatherMap refusée (401)")
    r.raise_for_status()
    main = r.json()["main"]
    return main["temp"], main["humidity"]

# --- Envoi d'un uplink simulé à TTN ---
def envoyer_a_ttn(payload, fcnt):
    url = f"{TTN_BASE}/as/applications/{APP_ID}/devices/{DEVICE_ID}/up/simulate"
    body = {
        "end_device_ids": {"device_id": DEVICE_ID,
                           "application_ids": {"application_id": APP_ID}},
        "received_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "uplink_message": {
            "f_port": FPORT,
            "f_cnt": fcnt,
            "frm_payload": base64.b64encode(payload).decode(),
            # informations radio simulées (TTN les exige, même pour une simulation)
            "rx_metadata": [{"gateway_ids": {"gateway_id": "test"},
                             "rssi": -90, "channel_rssi": -90, "snr": 7.5}],
            "settings": {"data_rate": {"lora": {"bandwidth": 125000, "spreading_factor": 7}},
                         "coding_rate": "4/5", "frequency": "868100000"},
        },
    }
    return requests.post(url, json=body, timeout=15,
                         headers={"Authorization": f"Bearer {TTN_KEY}"})

def main():
    fcnt = 0
    print(f"Capteur virtuel démarré : OpenWeatherMap ({CITY}) -> TTN, un envoi toutes les {PERIOD} s")
    while True:
        try:
            temp, hum = lire_meteo()
            payload = cayenne_temperature(1, temp) + cayenne_humidity(2, hum)
            r = envoyer_a_ttn(payload, fcnt)
            if r.status_code == 200:
                print(f"[TTN] uplink #{fcnt} envoyé : T={temp} C  H={hum} %  "
                      f"payload: {payload.hex(' ').upper()} ({len(payload)} octets)")
                fcnt += 1
            else:
                print(f"[TTN] erreur {r.status_code} : {r.text[:1500]}")
        except Exception as e:
            print("[erreur]", e)
        time.sleep(PERIOD)

if __name__ == "__main__":
    main()
