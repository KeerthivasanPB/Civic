const https = require('https');
const q = '[out:json];(way["highway"="construction"](12.9,77.5,13.0,77.7);node["highway"="construction"](12.9,77.5,13.0,77.7););out center 5;';
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);

https.get(url, { headers: { 'User-Agent': 'CivicSyncTest/1.0', 'Accept': 'application/json' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log("STATUS:", res.statusCode, data.slice(0, 300)));
}).on('error', console.error);
