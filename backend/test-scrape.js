const https = require('https');
const query = `[out:json];(way["highway"="construction"](12.8,77.4,13.1,77.8);node["highway"="construction"](12.8,77.4,13.1,77.8););out center 20;`;
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data).elements, null, 2)));
});
