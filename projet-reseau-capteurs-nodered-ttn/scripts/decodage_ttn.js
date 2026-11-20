// Reçoit un message "up" de TTN (déjà décodé par le formateur CayenneLPP)
const up = msg.payload;
const um = up.uplink_message || {};
const dec = um.decoded_payload || {};

// Les noms des champs décodés finissent par le numéro de canal (ex. temperature_1)
function trouver(prefixes) {
    for (const k of Object.keys(dec)) {
        for (const p of prefixes) {
            if (k.indexOf(p) === 0) { return dec[k]; }
        }
    }
    return undefined;
}
const temperature = trouver(['temperature']);
const humidity = trouver(['relative_humidity', 'humidity']);
if (temperature === undefined || humidity === undefined) {
    node.warn('Payload décodé inattendu : ' + JSON.stringify(dec));
    return null;
}

const rx = (um.rx_metadata && um.rx_metadata[0]) || {};
const gw = rx.gateway_ids ? rx.gateway_ids.gateway_id : 'n/a';
const dev = up.end_device_ids ? up.end_device_ids.device_id : 'n/a';
const t = up.received_at ? new Date(up.received_at).toLocaleTimeString('fr-FR') : 'n/a';
const fcnt = (um.f_cnt !== undefined) ? um.f_cnt : 'n/a';

const infos = {
    device_id: dev, fcnt: fcnt, fport: um.f_port, received_at: up.received_at,
    gateway_id: gw, rssi: rx.rssi, snr: rx.snr,
    temperature: temperature, humidity: humidity
};
const texte = '#' + fcnt + ' | ' + dev + ' | passerelle ' + gw +
              ' | RSSI ' + rx.rssi + ' dBm | SNR ' + rx.snr + ' dB | reçu à ' + t;

node.status({fill: 'green', shape: 'dot', text: temperature + ' °C / ' + humidity + ' %'});
return [
    {payload: infos},
    {payload: temperature, topic: 'Température'},
    {payload: humidity, topic: 'Humidité'},
    {payload: texte}
];
