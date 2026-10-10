const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_dxRz90lYAseS@ep-purple-silence-b5veav35-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function run() {
  const depts = ['BBMP', 'BESCOM', 'BWSSB', 'BMRCL', 'Traffic Police', 'PWD', 'NHAI'];
  const conts = ['L&T', 'ABC Infra', 'City Builders', 'Sri Rama Works', 'Nagarjuna Const', 'Mega Engg'];
  const descs = ['Road widening project.', 'Underground cabling.', 'Sewer line replacement.', 'Metro construction.', 'Pothole repair.', 'Drainage clearing.'];
  
  let count = 0;
  for(let i = 0; i < 90; i++) {
    const lat = 12.85 + (Math.random() * 0.25);
    const lng = 77.45 + (Math.random() * 0.30);
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const cont = conts[Math.floor(Math.random() * conts.length)];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    const status = Math.random() > 0.5 ? 'ongoing' : 'planned';
    
    await pool.query('INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
      [`Civic Work Area ${i}`, dept, cont, '2026-10-01', '2026-11-01', lat, lng, status, desc]
    );
    count++;
  }
  console.log('Seeded ' + count + ' massive mock projects!');
  process.exit(0);
}
run();
