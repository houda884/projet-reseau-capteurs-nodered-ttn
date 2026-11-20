// RÈGLES D'ALERTE : compare les mesures aux seuils réglables sur le dashboard
let sT = flow.get('seuilT'); if (sT === undefined) { sT = 27; }   // °C
let sH = flow.get('seuilH'); if (sH === undefined) { sH = 90; }   // %
let last = flow.get('last');                                       // dernières mesures
const heure = new Date().toLocaleTimeString('fr-FR');

// 1) Que reçoit-on ? un seuil modifié, le bouton de test, ou une nouvelle mesure
if (msg.topic === 'seuilT') {
    sT = Number(msg.payload); flow.set('seuilT', sT);
} else if (msg.topic === 'seuilH') {
    sH = Number(msg.payload); flow.set('seuilH', sH);
} else if (msg.topic === 'test') {
    const texte = 'Alerte de test déclenchée à ' + heure;
    return [
        {payload: texte, topic: 'ALERTE (test)'},
        {payload: 'ALERTE (test)'},
        {payload: heure + ' : alerte de test'},
        {payload: 'Seuils : T > ' + sT + ' °C | H > ' + sH + ' %'}
    ];
} else if (msg.payload && msg.payload.temperature !== undefined) {
    last = msg.payload; flow.set('last', last);
}

const seuils = {payload: 'Seuils : T > ' + sT + ' °C | H > ' + sH + ' %'};
if (!last) {
    return [null, {payload: 'En attente de mesures...'}, null, seuils];
}

// 2) Évaluation
const alertes = [];
if (last.temperature > sT) { alertes.push('Température ' + last.temperature + ' °C > seuil ' + sT + ' °C'); }
if (last.humidity > sH)    { alertes.push('Humidité ' + last.humidity + ' % > seuil ' + sH + ' %'); }

if (alertes.length > 0) {
    node.status({fill: 'red', shape: 'dot', text: 'ALERTE'});
    return [
        {payload: alertes.join(' ; '), topic: 'ALERTE'},          // notification
        {payload: 'ALERTE : ' + alertes.join(' ; ')},           // état
        {payload: heure + ' : ' + alertes.join(' ; ')},            // dernière alerte
        seuils
    ];
}
node.status({fill: 'green', shape: 'dot', text: 'normal'});
return [null, {payload: 'Normal : ' + last.temperature + ' °C, ' + last.humidity + ' %'}, null, seuils];
