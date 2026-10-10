const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_dxRz90lYAseS@ep-purple-silence-b5veav35-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function run() {
  const depts = ['NHAI', 'PWD', 'State Water Board', 'Telecom', 'Railway Board', 'Municipal Corp'];
  const conts = ['L&T', 'Reliance Infra', 'Tata Projects', 'GMR', 'HCC', 'Gammon India'];
  const descs = ['National Highway Expansion.', 'Interstate Bridge Construction.', 'Optic Fiber Backbone Laying.', 'Railway Track Upgrades.', 'Rural Water Supply Pipeline.', 'Smart City Road Works.'];
  
  let count = 0;
  for(let i = 0; i < 200; i++) {
    // Generate random lat/lng across all of India
    // Lat: ~8.0 to ~32.0, Lng: ~68.0 to ~92.0
    const lat = 8.0 + (Math.random() * 24.0);
    const lng = 68.0 + (Math.random() * 24.0);
    
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const cont = conts[Math.floor(Math.random() * conts.length)];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    const status = Math.random() > 0.5 ? 'ongoing' : 'planned';
    
    await pool.query('INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
      [`National Infra Project ${i}`, dept, cont, '2026-10-01', '2027-10-01', lat, lng, status, desc]
    );
    count++;
  }
  console.log('Seeded ' + count + ' All-India projects!');
  process.exit(0);
}
run();
