const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_dxRz90lYAseS@ep-purple-silence-b5veav35-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function run() {
  await pool.query(`
    INSERT INTO projects (title, department, contractor, start_date, end_date, lat, lng, status, description) VALUES
    ('Metro Pillar Excavation', 'BMRCL', 'L&T', '2026-10-01', '2026-12-01', 12.9780, 77.5950, 'ongoing', 'Excavation for Metro Pillar 114.'),
    ('Sewer Line Upgrade', 'BWSSB', 'Nagarjuna Const', '2026-11-01', '2026-11-20', 12.9650, 77.5800, 'planned', 'Upgrading 50-year old sewer lines.'),
    ('Pothole Filling', 'BBMP', 'Sri Rama Works', '2026-10-05', '2026-10-08', 12.9250, 77.5850, 'ongoing', 'Filling arterial road potholes.'),
    ('Overhead Wire Burial', 'BESCOM', 'PowerGrid', '2026-10-15', '2026-11-15', 12.9850, 77.6050, 'planned', 'Moving HT cables underground.'),
    ('Storm Water Drain', 'BBMP', 'ABC Infra', '2026-09-01', '2026-10-30', 12.9150, 77.6250, 'ongoing', 'Clearing silt from primary SWD.'),
    ('Streetlight Pole Inst.', 'BESCOM', 'LightWorks', '2026-10-10', '2026-10-12', 12.9550, 77.6350, 'ongoing', 'Installing 20 new LED poles.'),
    ('Footpath Relaying', 'BBMP', 'City Builders', '2026-10-20', '2026-11-05', 12.9450, 77.6150, 'planned', 'TenderSURE footpath upgrade.'),
    ('Gas Pipeline Laying', 'GAIL', 'Mega Engg', '2026-10-11', '2026-11-11', 12.9050, 77.5950, 'ongoing', 'PNG pipeline expansion.'),
    ('Underpass Construction', 'NHAI', 'L&T', '2026-08-01', '2026-12-31', 12.8950, 77.6550, 'ongoing', 'Grade separator construction.'),
    ('CCTV Pole Erection', 'Traffic Police', 'SafeCity', '2026-10-09', '2026-10-10', 12.9750, 77.6150, 'completed', 'Traffic monitoring cameras.')
  `);
  console.log('Seeded successfully!');
  process.exit(0);
}
run();
