const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const https = require('https');
const { Pool } = require('pg');

const app = express();
const port = 5000;
const SECRET_KEY = "civicsync_super_secret_key_hackathon";

app.use(cors());
app.use(express.json());

// --- NEON POSTGRESQL CONNECTION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                department VARCHAR(100),
                contractor VARCHAR(100),
                start_date VARCHAR(50),
                end_date VARCHAR(50),
                lat FLOAT,
                lng FLOAT,
                status VARCHAR(50),
                description TEXT
            )
        `);
        console.log("✅ Connected to Neon PostgreSQL and initialized tables.");
        
        // Seed initial data if empty
        const res = await pool.query('SELECT COUNT(*) FROM projects');
        if (parseInt(res.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) VALUES
                ('Water Pipeline Replacement', 'Water Board', 'ABC Infra', '2026-10-01', '2026-10-25', 12.9716, 77.5946, 'ongoing', 'Laying 300mm pipe from junction to main road.'),
                ('Fiber Optic Cable Laying', 'Telecom', 'XYZ Comms', '2026-10-15', '2026-10-30', 12.9716, 77.5946, 'planned', 'Laying 5G fiber optic cables along the main road.'),
                ('Road Resurfacing', 'PWD', 'City Builders', '2026-09-01', '2026-09-30', 12.9352, 77.6245, 'completed', 'White topping of 100ft road.')
            `);
            console.log("🌱 Seeded initial projects into Neon.");
        }
    } catch (err) {
        console.error("❌ Database initialization error:", err);
    }
}
initDB();

// --- DATABASE (Users remain In-Memory for hackathon auth speed) ---
let users = [
    { id: 1, email: 'admin@gov.in', password: 'password123', role: 'admin', name: 'Nodal Officer' },
    { id: 2, email: 'contractor@abc.com', password: 'password123', role: 'contractor', name: 'ABC Infra' }
];

// We start with our 3 perfectly placed mock projects to guarantee the "Dig Once" demo works.
let projects = [
    { id: 1, title: "Water Pipeline Replacement", department: "Water Board", contractor: "ABC Infra", status: "ongoing", startDate: "2026-10-01", endDate: "2026-10-25", lat: 12.9716, lng: 77.5946, description: "Laying 300mm pipe from junction to main road." },
    { id: 2, title: "Fiber Optic Cable Laying", department: "Telecom", contractor: "XYZ Comms", status: "planned", startDate: "2026-10-15", endDate: "2026-10-30", lat: 12.9716, lng: 77.5946, description: "Laying 5G fiber optic cables along the main road." },
    { id: 3, title: "Road Resurfacing", department: "PWD", contractor: "City Builders", status: "completed", startDate: "2026-09-01", endDate: "2026-09-30", lat: 12.9352, lng: 77.6245, description: "White topping of 100ft road." }
];

// --- STAGGERED REGIONAL POLLING ARCHITECTURE ---
const regions = [
    { name: "South India", bbox: "8.0,74.0,15.0,80.0" },
    { name: "West India", bbox: "15.0,68.0,24.0,76.0" },
    { name: "North India", bbox: "24.0,73.0,37.0,81.0" },
    { name: "East India", bbox: "15.0,80.0,27.0,97.0" }
];
let currentRegionIndex = 0;

async function fetchLiveOSMData() {
    const region = regions[currentRegionIndex];
    console.log(`Fetching live roadwork data for [${region.name}]...`);
    
    const query = `[out:json];(way["highway"="construction"](${region.bbox});node["highway"="construction"](${region.bbox}););out center 50;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'CivicSyncHackathonApp/1.0', 'Accept': 'application/json' }
        });
        const parsed = await response.json();
        
        if (parsed.elements && parsed.elements.length > 0) {
            let addedCount = 0;
            for (const el of parsed.elements) {
                const lat = el.center ? el.center.lat : el.lat;
                const lon = el.center ? el.center.lon : el.lon;
                
                if (lat && lon) {
                    const exists = await pool.query('SELECT id FROM projects WHERE lat = $1 AND lng = $2', [lat, lon]);
                    if (exists.rowCount === 0) {
                        await pool.query(`
                            INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        `, [
                            `Live Construction (${region.name})`, 'Gov Open Data (Live)', 'Unknown', '2026-01-01', '2026-12-31',
                            lat, lon, 'ongoing', `Live construction node fetched dynamically from ${region.name}.`
                        ]);
                        addedCount++;
                    }
                }
            }
            console.log(`✅ Added ${addedCount} new construction sites from ${region.name} into Neon PostgreSQL.`);
        }
    } catch (error) {
        console.error("OSM Fetch Error:", error.message);
    }

    currentRegionIndex = (currentRegionIndex + 1) % regions.length;
}

// Resilient Caching Architecture: 
// Instead of a brittle setInterval (which dies when free servers sleep), 
// we expose a webhook endpoint for external Cron services (like cron-job.org) to trigger.
app.get('/api/cron/sync', async (req, res) => {
    // Optional: Add a simple secret key check here so randos can't spam your API
    const authHeader = req.headers['authorization'];
    
    // Fire and forget (don't make cron-job wait for the Overpass API)
    fetchLiveOSMData();
    res.json({ success: true, message: "OSM Sync Triggered successfully." });
});

// Run once on startup just to ensure it works
fetchLiveOSMData();

// --- AUTH & RBAC MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user;
        next();
    });
};

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Insufficient role permissions" });
    }
    next();
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
});

app.post('/api/auth/register', (req, res) => {
    const { email, password, name, role } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Email already exists" });
    }
    const newUser = { id: users.length + 1, email, password, name, role: role || 'contractor' };
    users.push(newUser);
    
    const token = jwt.sign({ id: newUser.id, role: newUser.role, name: newUser.name }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: newUser.id, role: newUser.role, name: newUser.name, email: newUser.email } });
});

// --- API ENDPOINTS ---
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, title, department, contractor, start_date as \"startDate\", end_date as \"endDate\", lat, lng, status, description FROM projects WHERE status != 'pending'");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.post('/api/projects/check-conflict', async (req, res) => {
    const { lat, lng, startDate, endDate } = req.body;
    try {
        const result = await pool.query("SELECT id, title, department, contractor, start_date as \"startDate\", end_date as \"endDate\", lat, lng, status, description FROM projects WHERE status != 'pending'");
        const conflict = result.rows.find(p => 
            Math.abs(p.lat - lat) < 0.001 && Math.abs(p.lng - lng) < 0.001 && 
            ((new Date(startDate) <= new Date(p.endDate)) && (new Date(endDate) >= new Date(p.startDate)))
        );
        if (conflict) {
            return res.json({ conflict: true, message: `Co-location Opportunity Found! The ${conflict.department} is already planning work here from ${conflict.startDate} to ${conflict.endDate}. Please coordinate.`, conflictProject: conflict });
        }
        res.json({ conflict: false, message: "No conflicts detected." });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

// Protected Route: Contractors APPLY for projects
app.post('/api/projects/apply', authenticateToken, requireRole('contractor'), async (req, res) => {
    const { title, department, contractor, startDate, endDate, lat, lng } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'Awaiting government approval.') RETURNING id
        `, [title, department, contractor, startDate, endDate, lat, lng]);
        res.json({ message: "Permit submitted for government review.", id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

// Gov Route: Get pending permits
app.get('/api/projects/pending', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, title, department, contractor, start_date as \"startDate\", end_date as \"endDate\", lat, lng, status, description FROM projects WHERE status = 'pending'");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

// Gov Route: Approve permit
app.post('/api/projects/approve/:id', authenticateToken, requireRole('gov'), async (req, res) => {
    const permitId = parseInt(req.params.id);
    try {
        await pool.query("UPDATE projects SET status = 'planned' WHERE id = $1", [permitId]);
        res.json({ success: true, message: "Permit approved and published to map." });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.listen(port, () => {
    console.log(`\n🚀 CivicSync Backend running on http://localhost:${port}`);
});
