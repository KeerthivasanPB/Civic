const q = '[out:json];(way["highway"="construction"](12.9,77.5,13.0,77.7);node["highway"="construction"](12.9,77.5,13.0,77.7););out center 5;';
fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', 
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded', 
        'User-Agent': 'CivicSync/1.0'
    }, 
    body: 'data=' + encodeURIComponent(q)
}).then(r => r.text()).then(console.log);
