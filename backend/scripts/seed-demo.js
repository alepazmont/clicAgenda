#!/usr/bin/env node
/**
 * Seed demo: superadmin + 3 clínicas (dental, psicología, fisioterapia).
 * Requiere DATABASE_URL y esquema aplicado (001_schema.sql).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pg = require('../db/pg');

const PASSWORD_HASH = '$2a$10$vCCxlamo4f5ZgWq89NuFjeh9Bl/pXCVhuTmXEcfsPRzEq7.8hQaA6'; // changeme

const CLINICS = [
  {
    slug: 'demo_dental',
    name: 'Clínica Dental Sonrisa',
    specialty: 'dental',
    db_name: 'tenant_demo_dental',
    colors: { primary: '#0277bd', secondary: '#01579b' },
    short_description: 'Odontología general, estética e implantes en el centro de la ciudad.',
    description: 'Clínica dental moderna con más de 15 años de experiencia. Especialistas en ortodoncia invisible, implantes y estética dental.',
    phone: '912 345 001',
    email: 'info@sonrisa-demo.es',
    address: 'Calle Mayor 12, Madrid',
    services: [
      { name: 'Limpieza dental', duration: 45, price: 55, description: 'Profilaxis y revisión completa' },
      { name: 'Consulta ortodoncia', duration: 30, price: 0, description: 'Primera visita sin compromiso' },
      { name: 'Empaste composite', duration: 40, price: 75, description: 'Restauración estética' },
      { name: 'Blanqueamiento', duration: 60, price: 220, description: 'Tratamiento en clínica' },
    ],
    patients: [
      { name: 'Laura Fernández', email: 'laura.f@ejemplo.com', phone: '612111001', dni: '12345678A' },
      { name: 'Carlos Ruiz', email: 'carlos.r@ejemplo.com', phone: '612111002', dni: '23456789B' },
      { name: 'Elena Torres', email: 'elena.t@ejemplo.com', phone: '612111003', dni: '34567890C' },
      { name: 'Miguel Santos', email: 'miguel.s@ejemplo.com', phone: '612111004', dni: '45678901D' },
    ],
    professionals: [
      { name: 'Dra. Ana Belén Prieto', role: 'Directora · Odontóloga' },
      { name: 'Dr. Pablo Mena', role: 'Ortodoncista' },
    ],
  },
  {
    slug: 'demo_psicologia',
    name: 'Centro Psicológico Equilibrio',
    specialty: 'psicologia',
    db_name: 'tenant_demo_psicologia',
    colors: { primary: '#7b1fa2', secondary: '#4a148c' },
    short_description: 'Psicología clínica, de pareja y evaluación para adultos y adolescentes.',
    description: 'Equipo de psicólogos sanitarios colegiados. Enfoque integrador con terapia cognitivo-conductual y mindfulness.',
    phone: '912 345 002',
    email: 'hola@equilibrio-demo.es',
    address: 'Av. de la Constitución 45, Valencia',
    services: [
      { name: 'Terapia individual', duration: 50, price: 60, description: 'Sesión de psicología clínica' },
      { name: 'Terapia de pareja', duration: 60, price: 80, description: 'Sesión conjunta' },
      { name: 'Evaluación psicológica', duration: 90, price: 120, description: 'Informe clínico incluido' },
      { name: 'Sesión online', duration: 50, price: 55, description: 'Videoconsulta segura' },
    ],
    patients: [
      { name: 'Sofía Navarro', email: 'sofia.n@ejemplo.com', phone: '622222001', dni: '56789012E' },
      { name: 'David Herrera', email: 'david.h@ejemplo.com', phone: '622222002', dni: '67890123F' },
      { name: 'Paula Iglesias', email: 'paula.i@ejemplo.com', phone: '622222003', dni: '78901234G' },
    ],
    professionals: [
      { name: 'Dra. Marta Soler', role: 'Psicóloga clínica' },
      { name: 'Dr. Jorge Vidal', role: 'Psicólogo · Terapia de pareja' },
    ],
  },
  {
    slug: 'demo_fisioterapia',
    name: 'FisioSalud',
    specialty: 'fisioterapia',
    db_name: 'tenant_demo_fisioterapia',
    colors: { primary: '#2e7d32', secondary: '#1b5e20' },
    short_description: 'Fisioterapia, rehabilitación deportiva y tratamiento del dolor.',
    description: 'Centro de fisioterapia con sala de ejercicio terapéutico. Tratamos lesiones musculoesqueléticas, postoperatorios y readaptación deportiva.',
    phone: '912 345 003',
    email: 'contacto@fisiosalud-demo.es',
    address: 'Plaza del Ayuntamiento 3, Sevilla',
    services: [
      { name: 'Fisioterapia general', duration: 45, price: 45, description: 'Sesión manual y ejercicio' },
      { name: 'Rehabilitación deportiva', duration: 50, price: 50, description: 'Readaptación progresiva' },
      { name: 'Masaje terapéutico', duration: 40, price: 40, description: 'Descarga muscular' },
      { name: 'Punción seca', duration: 30, price: 42, description: 'Tratamiento de puntos gatillo' },
    ],
    patients: [
      { name: 'Roberto Gil', email: 'roberto.g@ejemplo.com', phone: '633333001', dni: '89012345H' },
      { name: 'Carmen Díaz', email: 'carmen.d@ejemplo.com', phone: '633333002', dni: '90123456J' },
      { name: 'Alberto Vega', email: 'alberto.v@ejemplo.com', phone: '633333003', dni: '01234567K' },
      { name: 'Isabel Moreno', email: 'isabel.m@ejemplo.com', phone: '633333004', dni: '11234567L' },
    ],
    professionals: [
      { name: 'Fisioterapeuta Laura Campos', role: 'Directora técnica' },
      { name: 'Fisioterapeuta Iván Peña', role: 'Readaptación deportiva' },
    ],
  },
];

function daysFromNow(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedClinic(client, instanceId, clinic) {
  await client.query(`SELECT set_config('app.instance_id', $1, true)`, [String(instanceId)]);

  const companyRes = await client.query(
    `INSERT INTO company (instance_id, name, colors, short_description, description, phone, email, address, professionals, portal_welcome_text, portal_cta_button)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
     ON CONFLICT (instance_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors
     RETURNING id`,
    [
      instanceId,
      clinic.name,
      JSON.stringify(clinic.colors),
      clinic.short_description,
      clinic.description,
      clinic.phone,
      clinic.email,
      clinic.address,
      JSON.stringify(clinic.professionals),
      `Bienvenido a ${clinic.name}. Solicita tu cita online.`,
      'Reservar cita',
    ]
  );
  const companyId = companyRes.rows[0].id;

  await client.query(
    `INSERT INTO users (instance_id, email, password_hash, name, role, company_id)
     VALUES ($1, 'admin@demo.es', $2, $3, 'admin', $4)
     ON CONFLICT (instance_id, email) DO NOTHING`,
    [instanceId, PASSWORD_HASH, `Admin ${clinic.name.split(' ').slice(-1)[0]}`, companyId]
  );
  const userRes = await client.query(
    'SELECT id FROM users WHERE instance_id = $1 AND email = $2',
    [instanceId, 'admin@demo.es']
  );
  const userId = userRes.rows[0].id;

  const patientIds = [];
  for (const p of clinic.patients) {
    const pr = await client.query(
      `INSERT INTO patients (instance_id, name, email, phone, dni)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [instanceId, p.name, p.email, p.phone, p.dni]
    );
    patientIds.push(pr.rows[0].id);
  }

  const serviceIds = [];
  for (const s of clinic.services) {
    const sr = await client.query(
      `INSERT INTO services (instance_id, name, duration_minutes, price, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [instanceId, s.name, s.duration, s.price, s.description]
    );
    serviceIds.push(sr.rows[0].id);
  }

  const slots = [
    { day: 1, hour: 9, patient: 0, service: 0 },
    { day: 1, hour: 11, patient: 1, service: 1 },
    { day: 2, hour: 10, patient: 2, service: 2 },
    { day: 3, hour: 16, patient: 0, service: 3 % serviceIds.length },
    { day: 4, hour: 12, patient: 1, service: 0 },
    { day: 5, hour: 9, patient: 2, service: 1 },
  ];

  for (const slot of slots) {
    const start = daysFromNow(slot.day, slot.hour);
    const end = new Date(start.getTime() + (clinic.services[slot.service]?.duration || 30) * 60000);
    const pid = patientIds[slot.patient % patientIds.length];
    const sid = serviceIds[slot.service % serviceIds.length];
    await client.query(
      `INSERT INTO appointments (instance_id, patient_id, user_id, service_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')`,
      [instanceId, pid, userId, sid, start, end]
    );
  }

  if (patientIds[0] && serviceIds[0]) {
    await client.query(
      `INSERT INTO patient_services (instance_id, patient_id, service_id, remaining_sessions)
       VALUES ($1, $2, $3, 5)`,
      [instanceId, patientIds[0], serviceIds[0]]
    );
  }

  if (patientIds[0]) {
    await client.query(
      `INSERT INTO medical_treatments (instance_id, patient_id, title, description, status, start_date)
       VALUES ($1, $2, $3, $4, 'active', CURRENT_DATE)`,
      [
        instanceId,
        patientIds[0],
        clinic.specialty === 'dental' ? 'Tratamiento de ortodoncia' : clinic.specialty === 'psicologia' ? 'Proceso terapéutico individual' : 'Recuperación lumbar',
        'Plan de seguimiento demo para capturas de portfolio.',
      ]
    );
  }
}

async function main() {
  const pool = pg.getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO superadmins (email, password_hash, name)
       VALUES ('admin@clicagenda.es', $1, 'Superadmin')
       ON CONFLICT (email) DO NOTHING`,
      [PASSWORD_HASH]
    );

    await client.query(
      `INSERT INTO plans (name, price_monthly, price_annual)
       SELECT 'Demo', 0, 0 WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Demo')`
    );

    const planRes = await client.query(`SELECT id FROM plans WHERE name = 'Demo' LIMIT 1`);
    const planId = planRes.rows[0].id;

    await client.query(
      `INSERT INTO templates (name, type)
       SELECT 'Por defecto', 'library' WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = 'Por defecto')`
    );

    const tplRes = await client.query(`SELECT id FROM templates WHERE name = 'Por defecto' LIMIT 1`);
    const templateId = tplRes.rows[0].id;

    for (const clinic of CLINICS) {
      const instRes = await client.query(
        `INSERT INTO instances (name, slug, db_name, domain_type, domain_value, plan_id, template_id, state, specialty, contact_email)
         VALUES ($1, $2, $3, 'path', $4, $5, $6, 'active', $7, $8)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, specialty = EXCLUDED.specialty
         RETURNING id`,
        [clinic.name, clinic.slug, clinic.db_name, clinic.slug, planId, templateId, clinic.specialty, clinic.email]
      );
      const instanceId = instRes.rows[0].id;

      const existing = await client.query(
        'SELECT COUNT(*)::int AS c FROM patients WHERE instance_id = $1',
        [instanceId]
      );
      if (existing.rows[0].c > 0) {
        console.log('Skip seed (ya tiene datos):', clinic.slug);
        continue;
      }

      await seedClinic(client, instanceId, clinic);
      console.log('Seed OK:', clinic.slug);
    }

    await client.query('COMMIT');
    console.log('Demo seed completado.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seedClinic, CLINICS, PASSWORD_HASH };
