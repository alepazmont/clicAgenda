const { seedClinic } = require('../scripts/seed-demo');
const pg = require('../db/pg');

async function seedNewInstance(instanceId, name, slug, specialty = 'general') {
  const client = await pg.getPool().connect();
  try {
    await client.query('BEGIN');
    await seedClinic(client, instanceId, {
      slug,
      name,
      specialty,
      db_name: `tenant_${slug}`,
      colors: { primary: '#1976d2', secondary: '#1565c0' },
      short_description: `Clínica ${name}`,
      description: `Instancia demo de ${name}.`,
      phone: '',
      email: '',
      address: '',
      services: [
        { name: 'Consulta general', duration: 30, price: 45, description: 'Primera consulta' },
        { name: 'Seguimiento', duration: 20, price: 25, description: 'Control periódico' },
      ],
      patients: [
        { name: 'Paciente Demo', email: 'paciente@demo.es', phone: '600000000', dni: '00000000X' },
      ],
      professionals: [{ name: 'Profesional Demo', role: 'Administrador' }],
    });
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { seedNewInstance };
